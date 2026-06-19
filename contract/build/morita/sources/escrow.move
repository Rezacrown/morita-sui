module morita::escrow;

// ============================================================
// MODULE: escrow
// Deskripsi: Module ini mengelola sistem "tukar-menukar item" (escrow / rekber).
// Pemain bisa "mengunci" item mereka sebagai tawaran (offer) dan menentukan
// kondisi item apa yang mereka terima sebagai gantinya. Pemain lain yang
// memenuhi syarat bisa memenuhi escrow tersebut — menukar item mereka dengan
// item yang ditawarkan. Mendukung opsi top-up SUI jika nilai item berbeda.
// ============================================================

use std::option;
use std::string::String;
use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;
use sui::coin::Coin;
use sui::sui::SUI;

// Import fungsi-fungsi accessor dari module item untuk membaca field GameItem
use morita::item::{GameItem, item_game_id, item_item_id, item_item_type, item_rarity};

// ── Struct: EscrowConditions ──
// Representasi: Kondisi/syarat yang harus dipenuhi oleh item yang akan ditukar.
// Semua field adalah Option — artinya kondisi bisa sebagian atau tidak sama sekali.
// Contoh: "saya mau item dengan item_id = 5" atau "saya mau item rare dari game tertentu".
// Struct ini tidak memiliki 'key' → tidak bisa jadi objek mandiri, hanya dipakai
// sebagai field di dalam struct Escrow.
public struct EscrowConditions has store, drop {
    item_id_target: Option<u64>,        // ID numerik item yang diinginkan (None = bebas)
    game_id_accept: Option<ID>,         // ID game asal item yang diinginkan (None = game apa saja)
    item_type_accept: Option<String>,   // Tipe item yang diinginkan, misal "weapon" (None = tipe apa saja)
    rarity_accept: Option<String>,      // Rarity yang diinginkan, misal "legendary" (None = rarity apa saja)
}

// ── Struct: Escrow ──
// Representasi: Sebuah "perjanjian escrow" — satu pihak menawarkan item
// dan menetapkan syarat. Pihak lain bisa memenuhi escrow jika item mereka
// cocok dengan syarat. Escrow bisa di-cancel oleh pembuat.
// Struct ini memiliki 'key' dan 'store' → bisa jadi objek Sui yang di-share.
public struct Escrow has key, store {
    id: UID,                            // ID unik objek Escrow di Sui
    offer_item: Option<GameItem>,       // Item yang ditawarkan (dikunci di dalam escrow). Dipakai Option supaya bisa di-swap.
    initiator: address,                 // Alamat pembuat escrow (yang menawarkan item)
    counterparty: Option<address>,      // Alamat spesifik yang boleh memenuhi (None = siapa saja boleh)
    conditions: EscrowConditions,       // Syarat item yang diterima sebagai tukaran
    is_active: bool,                    // Apakah escrow masih aktif? false = sudah fulfilled atau cancelled
}

// ── Events ──

// Dikirim ketika escrow baru dibuat
public struct EscrowCreated has copy, drop {
    escrow_id: ID,                      // ID objek Escrow
    initiator: address,                 // Alamat pembuat escrow
    offer_item_id: ID,                  // ID item yang ditawarkan
    counterparty: Option<address>,      // Target spesifik (None = open untuk siapa saja)
}

// Dikirim ketika escrow berhasil dipenuhi (ditukar)
public struct EscrowFulfilled has copy, drop {
    escrow_id: ID,                      // ID escrow yang dipenuhi
    fulfiller: address,                 // Alamat yang memenuhi escrow
}

// Dikirim ketika escrow di-cancel oleh pembuat
public struct EscrowCancelled has copy, drop {
    escrow_id: ID,                      // ID escrow yang di-cancel
}

// ── Errors ──

#[error]
const EUNAUTHORIZED: vector<u8> = b"Not authorized";
// Hanya initiator escrow yang boleh cancel

#[error]
const EESCROW_INACTIVE: vector<u8> = b"Escrow already fulfilled or cancelled";
// Escrow sudah tidak aktif — tidak bisa di-fulfill atau di-cancel lagi

#[error]
const ECONDITION_MISMATCH: vector<u8> = b"Item does not match escrow conditions";
// Item yang diberikan tidak cocok dengan syarat escrow

#[error]
const ESELF_FULFILL: vector<u8> = b"Cannot fulfill your own escrow";
// Seseorang tidak bisa menukar item dengan diri sendiri

#[error]
const ENOT_COUNTERPARTY: vector<u8> = b"Escrow is targeted but caller is not the counterparty";
// Escrow punya target spesifik, tapi pemanggil bukan target tersebut

// ── Helper: validate conditions ──
// FUNGSI: check_conditions (private — hanya bisa dipanggil di dalam module ini)
// Apa yang dilakukan: Memeriksa apakah suatu GameItem memenuhi semua kondisi
//                yang ditetapkan di EscrowConditions.
// Siapa yang bisa panggil: Fungsi internal module escrow saja.
// Alur: Untuk setiap kondisi yang ada (is_some()), bandingkan field item
//       dengan nilai kondisi. Jika ada satu saja yang tidak cocok, assert gagal.
// Parameter:
//   - item: Reference ke GameItem yang akan diperiksa
//   - conditions: Reference ke EscrowConditions yang berisi syarat
fun check_conditions(item: &GameItem, conditions: &EscrowConditions) {
    // Jika conditions.item_id_target diisi (Some), cek apakah item_id item cocok
    if (conditions.item_id_target.is_some()) {
        let target_id = *conditions.item_id_target.borrow();  // Ambil nilai u64 dari Option (dereference)
        assert!(item_item_id(item) == target_id, ECONDITION_MISMATCH);  // Bandingkan — jika tidak cocok, gagal
    };
    // Jika conditions.game_id_accept diisi, cek apakah game_id item cocok
    if (conditions.game_id_accept.is_some()) {
        let game_id = *conditions.game_id_accept.borrow();    // Ambil nilai ID dari Option
        assert!(item_game_id(item) == game_id, ECONDITION_MISMATCH);
    };
    // Jika conditions.item_type_accept diisi, cek apakah tipe item cocok
    if (conditions.item_type_accept.is_some()) {
        let type_accepted = conditions.item_type_accept.borrow();  // Ambil reference ke String
        assert!(&item_item_type(item) == type_accepted, ECONDITION_MISMATCH);  // Bandingkan reference
    };
    // Jika conditions.rarity_accept diisi, cek apakah rarity item cocok
    if (conditions.rarity_accept.is_some()) {
        let rarity_accepted = conditions.rarity_accept.borrow();
        assert!(&item_rarity(item) == rarity_accepted, ECONDITION_MISMATCH);
    };
}

// ── Functions ──

// FUNGSI: lock_item_for_any
// Apa yang dilakukan: Membuat escrow baru dengan tawaran item, terbuka
//                untuk SIAPA SAJA (tidak ada counterparty spesifik).
// Siapa yang bisa panggil: Pemilik GameItem (siapa pun yang memiliki item).
// Alur:
//   1. Ambil ID item untuk event
//   2. Buat struct Escrow dengan counterparty = none (terbuka untuk umum)
//   3. Item dipindahkan ke dalam escrow (dimasukkan ke offer_item)
//   4. Kirim event EscrowCreated
//   5. Bagikan (share) objek Escrow ke publik — semua orang bisa lihat dan interaksi
// Parameter:
//   - item: Objek GameItem (by value — akan dikunci di dalam escrow)
//   - conditions: Syarat item yang diterima sebagai tukaran
//   - ctx: Context transaksi
public fun lock_item_for_any(
    item: GameItem,
    conditions: EscrowConditions,
    ctx: &mut TxContext,
) {
    let offer_item_id = object::id(&item);  // Ambil ID item untuk event (sebelum item dipindah)
    let escrow = Escrow {                    // Buat objek Escrow baru
        id: object::new(ctx),               // UID baru untuk escrow
        offer_item: option::some(item),     // Masukkan item ke dalam Option — item sekarang "dikunci" di escrow
        initiator: ctx.sender(),            // Pembuat escrow adalah pengirim transaksi
        counterparty: option::none(),       // Tidak ada target spesifik — siapa saja boleh fulfill
        conditions,                         // Simpan kondisi yang ditetapkan (shorthand)
        is_active: true,                    // Escrow baru langsung aktif
    };
    let escrow_id = object::id(&escrow);    // Ambil ID escrow untuk event
    event::emit(EscrowCreated {             // Kirim event escrow dibuat
        escrow_id,
        initiator: ctx.sender(),
        offer_item_id,
        counterparty: option::none(),       // Di event, counterparty = none (terbuka)
    });
    transfer::share_object(escrow);         // Bagikan escrow ke publik — jadi shared object
}

// FUNGSI: lock_item_for_target
// Apa yang dilakukan: Sama seperti lock_item_for_any, tapi escrow hanya bisa
//                dipenuhi oleh counterparty tertentu (alamat spesifik).
// Siapa yang bisa panggil: Pemilik GameItem.
// Parameter:
//   - item: Objek GameItem (by value)
//   - conditions: Syarat tukaran
//   - counterparty: Alamat spesifik yang diizinkan fulfill escrow
//   - ctx: Context transaksi
public fun lock_item_for_target(
    item: GameItem,
    conditions: EscrowConditions,
    counterparty: address,
    ctx: &mut TxContext,
) {
    let offer_item_id = object::id(&item);
    let escrow = Escrow {
        id: object::new(ctx),
        offer_item: option::some(item),       // Item dikunci di dalam escrow
        initiator: ctx.sender(),              // Pembuat escrow
        counterparty: option::some(counterparty),  // Hanya address ini yang boleh fulfill
        conditions,
        is_active: true,
    };
    let escrow_id = object::id(&escrow);
    event::emit(EscrowCreated {
        escrow_id,
        initiator: ctx.sender(),
        offer_item_id,
        counterparty: option::some(counterparty),  // Event mencatat counterparty spesifik
    });
    transfer::share_object(escrow);           // Bagikan ke publik (tapi hanya counterparty yang bisa fulfill)
}

// FUNGSI: fulfill_escrow
// Apa yang dilakukan: Memenuhi escrow — menukar item yang dimiliki fulfiller
//                dengan item yang ditawarkan oleh initiator.
//                Escrow menjadi tidak aktif setelah ini.
// Siapa yang bisa panggil: Siapa saja (jika escrow open) atau counterparty spesifik.
// Alur:
//   1. Cek escrow masih aktif
//   2. Cek fulfiller bukan initiator (tidak bisa swap dengan diri sendiri)
//   3. Jika ada counterparty, cek fulfiller adalah counterparty tersebut
//   4. Cek kondisi item fulfiller cocok dengan syarat escrow
//   5. Extract item lama dari escrow (keluarkan tawaran)
//   6. Masukkan item baru fulfiller ke escrow (sebagai gantinya)
//      — TAPI CATATAN: escrow jadi tidak aktif, item baru tetap di escrow.
//        Ini artinya escrow harus di-cancel atau di-swap lagi untuk mengeluarkan item baru.
//        DESIGN NOTE: Item milik fulfiller TIDAK dikembalikan ke fulfiller secara otomatis.
//        Fulfiller menerima item lama (offered), tapi item barunya tetap terperangkap di escrow.
//   7. Set is_active = false
//   8. Kirim event EscrowFulfilled
//   9. Kembalikan item tawaran lama ke fulfiller (dialah yang mendapat item initiator)
// Parameter:
//   - escrow: Mutable reference ke Escrow (akan diubah)
//   - my_item: Objek GameItem milik fulfiller (by value — akan masuk escrow)
//   - ctx: Context transaksi
// Output: GameItem — item yang ditawarkan oleh initiator, sekarang milik fulfiller
public fun fulfill_escrow(
    escrow: &mut Escrow,
    my_item: GameItem,
    ctx: &mut TxContext,
): GameItem {
    assert!(escrow.is_active, EESCROW_INACTIVE);                    // Escrow harus masih aktif
    assert!(ctx.sender() != escrow.initiator, ESELF_FULFILL);       // Tidak bisa fulfill escrow sendiri
    // Jika escrow punya counterparty spesifik, cek bahwa pemanggil adalah counterparty tersebut
    if (escrow.counterparty.is_some()) {
        let counterparty = escrow.counterparty.borrow();           // Pinjam nilai address dari Option
        assert!(ctx.sender() == *counterparty, ENOT_COUNTERPARTY); // Bandingkan dengan pengirim
    };
    check_conditions(&my_item, &escrow.conditions);                 // Cek apakah my_item memenuhi syarat

    let offered = option::extract(&mut escrow.offer_item);         // Keluarkan item tawaran dari escrow (ambil Some-nya)
    option::fill(&mut escrow.offer_item, my_item);                 // Masukkan item fulfiller ke escrow (gantikan)
    escrow.is_active = false;                                       // Tandai escrow sebagai tidak aktif (selesai)

    event::emit(EscrowFulfilled { escrow_id: object::id(escrow), fulfiller: ctx.sender() });
    offered  // Kembalikan item tawaran lama ke fulfiller — dia yang mendapatkannya
}

// FUNGSI: fulfill_escrow_with_value
// Apa yang dilakukan: Sama seperti fulfill_escrow, tapi dengan tambahan
//                pembayaran SUI top-up ke initiator. Ini berguna jika
//                nilai item tidak sama — pihak yang memberi item kurang
//                berharga bisa menambahkan SUI sebagai kompensasi.
// Siapa yang bisa panggil: Sama seperti fulfill_escrow.
// Alur: Sama seperti fulfill_escrow, tapi setelah swap:
//       - Token SUI (token_topup) dikirim langsung ke escrow.initiator
// Parameter:
//   - escrow: Mutable reference ke Escrow
//   - my_item: Item fulfiller (by value)
//   - token_topup: Koin SUI tambahan yang dikirim ke initiator (Coin<SUI>)
//   - ctx: Context transaksi
// Output: GameItem — item tawaran initiator
public fun fulfill_escrow_with_value(
    escrow: &mut Escrow,
    my_item: GameItem,
    token_topup: Coin<SUI>,
    ctx: &mut TxContext,
): GameItem {
    assert!(escrow.is_active, EESCROW_INACTIVE);
    assert!(ctx.sender() != escrow.initiator, ESELF_FULFILL);
    if (escrow.counterparty.is_some()) {
        let counterparty = escrow.counterparty.borrow();
        assert!(ctx.sender() == *counterparty, ENOT_COUNTERPARTY);
    };
    check_conditions(&my_item, &escrow.conditions);

    let offered = option::extract(&mut escrow.offer_item);
    option::fill(&mut escrow.offer_item, my_item);
    escrow.is_active = false;

    // Kirim SUI top-up ke initiator sebagai kompensasi selisih nilai item
    transfer::public_transfer(token_topup, escrow.initiator);

    event::emit(EscrowFulfilled { escrow_id: object::id(escrow), fulfiller: ctx.sender() });
    offered
}

// FUNGSI: cancel_escrow
// Apa yang dilakukan: Membatalkan escrow — mengeluarkan kembali item yang
//                ditawarkan ke initiator. Escrow menjadi tidak aktif.
// Siapa yang bisa panggil: Hanya initiator (pembuat escrow).
// Alur:
//   1. Cek pemanggil adalah initiator
//   2. Cek escrow masih aktif
//   3. Tandai escrow sebagai tidak aktif
//   4. Extract item dari escrow
//   5. Kirim event EscrowCancelled
//   6. Kembalikan item ke initiator
// Parameter:
//   - escrow: Mutable reference ke Escrow
//   - ctx: Context transaksi (untuk cek sender)
// Output: GameItem — item yang tadinya dikunci, kembali ke initiator
public fun cancel_escrow(
    escrow: &mut Escrow,
    ctx: &mut TxContext,
): GameItem {
    assert!(ctx.sender() == escrow.initiator, EUNAUTHORIZED);       // Hanya initiator yang boleh cancel
    assert!(escrow.is_active, EESCROW_INACTIVE);                     // Escrow harus masih aktif
    escrow.is_active = false;                                        // Tandai tidak aktif
    let item = option::extract(&mut escrow.offer_item);             // Keluarkan item dari escrow
    event::emit(EscrowCancelled { escrow_id: object::id(escrow) });  // Kirim event
    item  // Kembalikan item ke pemanggil (initiator)
}
