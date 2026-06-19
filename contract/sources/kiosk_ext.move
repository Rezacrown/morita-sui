module morita::kiosk_ext;

// ============================================================
// MODULE: kiosk_ext
// Deskripsi: Module ini adalah "ekstensi kiosk" — memanfaatkan sistem
// Kiosk bawaan Sui untuk jual-beli GameItem. Pemain bisa listing item
// mereka di kiosk dengan harga tertentu (plus royalty opsional), dan
// pembeli bisa membeli item dari kiosk. Module ini mengintegrasikan
// GameItem dengan Kiosk + TransferPolicy Sui.
// ============================================================

use sui::event;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::coin::Coin;
use sui::sui::SUI;
use sui::object::{Self, ID};
use sui::package::Publisher;
use sui::transfer;
use sui::transfer_policy::{Self as tp, TransferPolicy};
use sui::tx_context::TxContext;

use morita::item::GameItem;

// ── Events ──

// Dikirim ketika suatu GameItem di-listing untuk dijual di kiosk
public struct ItemListed has copy, drop {
    item_id: ID,                // ID objek GameItem yang di-listing
    kiosk_id: ID,               // ID kiosk tempat item di-listing
    price: u64,                 // Harga dalam MIST (1 SUI = 1_000_000_000 MIST)
    royalty_bps: Option<u64>,   // Royalti dalam basis points (bps), misal 500 = 5%. None = tidak ada royalti
}

// Dikirim ketika suatu GameItem berhasil dibeli dari kiosk
public struct ItemSold has copy, drop {
    item_id: ID,                // ID objek GameItem yang terjual
    seller: address,            // Alamat wallet penjual (pemilik kiosk)
    buyer: address,             // Alamat wallet pembeli
    price: u64,                 // Harga jual dalam MIST
}

// ── Errors ──

#[error]
const EINVALID_ROYALTY: vector<u8> = b"Royalty basis points must be 0-10000";
// Royalti harus antara 0 - 10.000 bps (0% - 100%). Lebih dari 10.000 tidak valid.

// ── Functions ──

// FUNGSI: list_for_sale
// Apa yang dilakukan: Menempatkan GameItem ke dalam kiosk milik penjual,
//                lalu menetapkan harga jual (listing). Royalti opsional
//                bisa ditambahkan (misal untuk creator/platform).
// Siapa yang bisa panggil: Pemilik kiosk (pemegang KioskOwnerCap) yang juga
//                pemilik GameItem.
// Alur:
//   1. Validasi royalty_bps (jika ada) harus <= 10.000
//   2. Ambil ID item dan ID kiosk untuk event
//   3. Tempatkan item ke kiosk (kiosk.place) — item masuk ke dalam kiosk
//   4. Listing item dengan harga (kiosk::list) — pasang harga jual
//   5. Kirim event ItemListed
// Parameter:
//   - item: Objek GameItem (by value — akan dipindahkan ke kiosk)
//   - kiosk: Mutable reference ke Kiosk milik penjual
//   - kiosk_owner_cap: Reference ke KioskOwnerCap (bukti kepemilikan kiosk)
//   - price: Harga dalam MIST (u64)
//   - royalty_bps: Opsional, persentase royalti dalam basis points (Option<u64>)
//   - _ctx: Context (tidak dipakai langsung)
public fun list_for_sale(
    item: GameItem,
    kiosk: &mut Kiosk,
    kiosk_owner_cap: &KioskOwnerCap,
    price: u64,
    royalty_bps: Option<u64>,
    _ctx: &mut TxContext,
) {
    // Jika royalty_bps diisi (Some), validasi bahwa nilainya tidak lebih dari 10.000 (100%)
    if (royalty_bps.is_some()) {
        let bps = royalty_bps.borrow();    // Pinjam nilai di dalam Option (tidak mengeluarkannya)
        assert!(*bps <= 10000, EINVALID_ROYALTY);  // Dereference bps untuk mendapatkan nilai u64
    };
    let item_id = object::id(&item);      // Ambil ID GameItem untuk event
    let kiosk_id = object::id(kiosk);     // Ambil ID kiosk untuk event
    kiosk.place(kiosk_owner_cap, item);    // Place: pindahkan item ke dalam kiosk — sekarang kiosk yang "memegang" item
    kiosk::list<GameItem>(kiosk, kiosk_owner_cap, item_id, price);  // List: pasang item dengan harga — siapa pun bisa lihat dan beli
    event::emit(ItemListed {              // Kirim event item di-listing
        item_id,
        kiosk_id,
        price,
        royalty_bps,
    });
}

// FUNGSI: buy_item
// Apa yang dilakukan: Membeli GameItem dari kiosk. Pembeli membayar dengan
//                Coin<SUI>, lalu menerima GameItem. TransferPolicy digunakan
//                untuk memverifikasi bahwa transfer diperbolehkan.
// Siapa yang bisa panggil: Siapa saja (pembeli) — asal punya cukup SUI.
// Alur:
//   1. Ambil nilai koin (price) dari payment
//   2. Panggil kiosk::purchase → ini mengembalikan (item, transfer_req)
//      - item: GameItem yang dibeli
//      - transfer_req: Permintaan transfer yang perlu dikonfirmasi
//   3. Konfirmasi transfer_req via TransferPolicy (tp::confirm_request)
//   4. Kirim event ItemSold
//   5. Kembalikan GameItem ke pembeli
// Parameter:
//   - kiosk: Mutable reference ke Kiosk penjual
//   - transfer_policy: Reference ke TransferPolicy untuk GameItem (mengatur aturan transfer)
//   - item_id: ID GameItem yang ingin dibeli
//   - payment: Koin SUI yang dibayarkan (Coin<SUI>)
//   - ctx: Context transaksi (untuk ambil alamat pembeli)
// Output: Objek GameItem — otomatis menjadi milik pemanggil
public fun buy_item(
    kiosk: &mut Kiosk,
    transfer_policy: &TransferPolicy<GameItem>,
    item_id: ID,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
): GameItem {
    let price = payment.value();                    // Ambil jumlah SUI yang dibayarkan (dalam MIST)
    // Panggil purchase bawaan Sui Kiosk:
    // Fungsi ini mengeluarkan item dari kiosk, menerima payment,
    // dan mengembalikan (item, transfer_req) — transfer_req perlu dikonfirmasi
    let (item, transfer_req) = kiosk::purchase<GameItem>(kiosk, item_id, payment);
    // Konfirmasi bahwa transfer ini diizinkan oleh TransferPolicy
    // TransferPolicy biasanya mengatur royalti, aturan transfer, dll.
    tp::confirm_request(transfer_policy, transfer_req);
    // Kirim event item terjual
    event::emit(ItemSold { item_id, seller: kiosk.owner(), buyer: ctx.sender(), price });
    item
}

public fun create_transfer_policy(publisher: &Publisher, ctx: &mut TxContext) {
    let (tp, cap) = tp::new<GameItem>(publisher, ctx);
    transfer::public_share_object(tp);
    transfer::public_transfer(cap, ctx.sender())
}
