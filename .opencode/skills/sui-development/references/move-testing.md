# Move Unit Testing

## Test Structure

Tests go in modules with `_tests` suffix. Test functions inside `_tests` modules should NOT be prefixed with `test_` — the module name already indicates these are tests.

```move
module my_package::my_module_tests;

#[test]
fun create_item_succeeds() {
    let ctx = &mut tx_context::dummy();
    let item = my_module::create_item(b"sword".to_string(), ctx);
    assert_eq!(item.name(), b"sword".to_string());
    test_utils::destroy(item);
}
```

## Assertions

### Use `assert_eq!` for Comparisons

```move
use std::unit_test::assert_eq;

// CORRECT — shows both values on failure
assert_eq!(result, 100);
assert_eq!(result, expected_value);

// WRONG — no diagnostic info
assert!(result == 100);
```

Use plain `assert!` only for boolean conditions:

```move
assert!(is_valid);
assert!(vec.length() > 0);
```

### No Abort Codes in Test `assert!`

```move
// WRONG — numeric code may collide with app errors
assert!(is_success, 0);

// CORRECT — no abort code
assert!(is_success);
```

## Test Context

### `tx_context::dummy()` for Simple Tests

Use when you just need a TxContext — no multi-transaction simulation needed:

```move
#[test]
fun mint_returns_correct_value() {
    let ctx = &mut tx_context::dummy();
    let item = app::create_item(100, ctx);
    assert_eq!(item.value(), 100);
    test_utils::destroy(item);
}
```

### `test_scenario` for Multi-Transaction Tests

Use when you need: multiple transactions, different senders, shared objects, transfers between addresses, or testing `init`:

```move
#[test]
fun owner_can_update_item() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);

    app::create_item(b"sword".to_string(), scenario.ctx());

    scenario.next_tx(owner);
    let mut item = scenario.take_from_sender<Item>();
    app::set_name(&mut item, b"great sword".to_string());
    assert_eq!(app::name(&item), b"great sword".to_string());
    scenario.return_to_sender(item);

    scenario.end();
}
```

### Test Scenario API

| Function | Purpose |
|----------|---------|
| `test_scenario::begin(@addr)` | Start scenario |
| `scenario.next_tx(@addr)` | New transaction with sender |
| `scenario.take_from_sender<T>()` | Take owned object sent to sender |
| `scenario.return_to_sender(obj)` | Return owned object |
| `scenario.take_shared<T>()` | Take shared object by type |
| `test_scenario::return_shared(obj)` | Return shared object |
| `scenario.has_most_recent_for_sender<T>()` | Check sender has object |
| `scenario.end()` | Finalize (required for non-aborting tests) |

## Expected Failure Tests

```move
// Correct — merged attributes on one line
#[test, expected_failure(abort_code = ENotAuthorized, location = app)]
fun unauthorized_access_aborts() {
    let mut scenario = test_scenario::begin(@0xA);
    app::create_item(scenario.ctx());

    scenario.next_tx(@0xB);
    app::admin_function(&AdminCap { id: test_utils::dummy_uid() }, scenario.ctx());
    // No cleanup — test aborts above
}
```

### `expected_failure` Rules

1. Merge `#[test]` and `#[expected_failure(...)]` on one line
2. Use `location = <module>` when abort happens in a different module than the test module
3. The `location` is just the module name (e.g., `app`), not the fully qualified path (`my_package::app`)
4. Skip cleanup in expected failure tests — code after the abort point is dead code

## Cleanup

Always use `sui::test_utils::destroy` — never write custom `destroy_for_testing`:

```move
use sui::test_utils::destroy;

// WRONG
nft.destroy_for_testing();

// CORRECT
destroy(nft);
destroy(app);
```

## Testing init Functions

```move
#[test]
fun init_creates_admin_cap() {
    let mut scenario = test_scenario::begin(@0xA);

    // init is called automatically, or via a test helper:
    app::init_for_testing(scenario.ctx());

    scenario.next_tx(@0xA);
    assert!(scenario.has_most_recent_for_sender<AdminCap>());

    scenario.end();
}
```

Use `#[test_only]` to gate `init_for_testing` helpers.

## Shared Object Tests

```move
#[test]
fun shared_counter_increments() {
    let mut scenario = test_scenario::begin(@0xA);
    app::create_counter(scenario.ctx());

    scenario.next_tx(@0xB);
    let mut counter = scenario.take_shared<Counter>();
    app::increment(&mut counter);
    assert_eq!(app::value(&counter), 1);
    test_scenario::return_shared(counter);

    scenario.end();
}
```

## Unauthorized Caller Test

```move
#[test, expected_failure(abort_code = app::ENotOwner, location = app)]
fun non_owner_cannot_update_item() {
    let owner = @0xA;
    let attacker = @0xB;
    let mut scenario = test_scenario::begin(owner);

    app::create_shared_item(b"shield".to_string(), scenario.ctx());

    scenario.next_tx(attacker);
    let mut item = scenario.take_shared<Item>();
    app::admin_update(&mut item, b"hacked".to_string(), scenario.ctx());
}
```

## Quick Reference

| Pattern | Correct | Wrong |
|---------|---------|-------|
| Test naming | `create_pool_succeeds()` | `test_create_pool()` |
| Equality | `assert_eq!(x, 100)` | `assert!(x == 100, 0)` |
| Boolean | `assert!(is_valid)` | `assert!(is_valid, 0)` |
| Test attributes | `#[test, expected_failure(...)]` | Separate `#[test]` and `#[expected_failure]` |
| Expected failure cleanup | Let it abort | Calling `.end()` after abort |
| Simple context | `tx_context::dummy()` | Full `test_scenario` for simple tests |
| Cleanup | `test_utils::destroy(obj)` | `obj.destroy_for_testing()` |
| Shared object | `test_scenario` | Cannot use `dummy()` |
