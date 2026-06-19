module morita::item;

// ============================================================
// MODULE: item
// Deskripsi: Module ini mengelola "GameItem" — aset digital dalam game.
// Item bisa di-mint (diciptakan) oleh platform untuk pemain,
// dan bisa di-burn (dimusnahkan). Module ini bergantung pada module
// registry untuk memeriksa dan mencatat item_id yang sudah dipakai.
// ============================================================

use std::string::String;
use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;

// Import fungsi-fungsi dari module registry yang dibutuhkan untuk
// berinteraksi dengan data Game (minted_items, game_id, dll.)
use morita::registry::{Game, GameCapability, contains_minted_item, add_minted_item, remove_minted_item, game_id};

// ── Struct: GameItem ──
// Representasi: Sebuah item digital dalam game (senjata, skin, karakter, dll).
// Setiap item punya ID unik, tipe, rarity, dan referensi ke blob (metadata).
// Item bisa memiliki supply terbatas (Option<u64>).
// Struct ini memiliki 'key' dan 'store' → bisa ditransfer, disimpan, dan jadi aset milik pengguna.
public struct GameItem has key, store {
    id: UID,                // ID unik objek GameItem di Sui (setiap objek punya ID sendiri)
    game_id: ID,            // ID game asal item ini (milik game mana?)
    item_id: u64,           // ID numerik item dalam game (bisa di-assign oleh game dev, misal item #1, #2)
    item_type: String,      // Tipe item (misal: "weapon", "armor", "consumable", "skin")
    rarity: String,         // Tingkat kelangkaan (misal: "common", "rare", "epic", "legendary")
    blob_id: String,        // ID ke metadata/blob eksternal (bisa IPFS CID, URL, atau JSON string)
    supply: Option<u64>,    // Jumlah maksimum item ini yang bisa ada (None = unlimited, Some(n) = terbatas n)
}

// ── Events ──

// Dikirim ketika item baru di-mint
public struct ItemMinted has copy, drop {
    item_id: ID,            // ID objek GameItem yang di-mint
    game_id: ID,            // ID game asal item
    recipient: address,     // Alamat wallet yang menerima item
    blob_id: String,        // Blob ID dari item (untuk referensi metadata)
}

// Dikirim ketika item di-burn (dimusnahkan)
public struct ItemBurned has copy, drop {
    item_id: ID,            // ID objek GameItem yang di-burn
    game_id: ID,            // ID game asal item
}

// ── Errors ──

#[error]
const EITEM_EXISTS: vector<u8> = b"Item with this item_id already minted for this game";
// Terjadi ketika item_id yang sama sudah pernah di-mint untuk game yang sama

#[error]
const EITEM_GAME_MISMATCH: vector<u8> = b"Item does not belong to this Game";
// Terjadi ketika item yang akan di-burn tidak cocok dengan game yang disebutkan

// ── Public accessors ──
// Fungsi-fungsi getter public agar module lain (escrow, kiosk_ext, dll.)
// bisa membaca field dari GameItem tanpa harus akses langsung (field bersifat private di Move).

public fun item_game_id(item: &GameItem): ID { item.game_id }        // Ambil ID game dari item
public fun item_item_id(item: &GameItem): u64 { item.item_id }      // Ambil item_id numerik
public fun item_item_type(item: &GameItem): String { item.item_type } // Ambil tipe item
public fun item_rarity(item: &GameItem): String { item.rarity }     // Ambil rarity item

// ── Functions ──

// FUNGSI: mint
// Apa yang dilakukan: Membuat GameItem baru dan mencatatnya di daftar minted_items game.
//                Item baru otomatis langsung dikirim ke recipient (address).
// Siapa yang bisa panggil: Platform (pemegang GameCapability + mutable reference ke Game).
// Alur:
//   1. Cek apakah item_id sudah pernah di-mint → jika ya, tolak (EITEM_EXISTS)
//   2. Catat item_id di daftar minted_items game
//   3. Buat objek GameItem baru dengan semua field
//   4. Kirim event ItemMinted
//   5. Kembalikan GameItem — caller harus mentransfernya ke recipient
// Parameter:
//   - game: Mutable reference ke Game (untuk update daftar minted_items)
//   - _cap: Reference ke GameCapability (guard — hanya platform yang punya cap ini bisa mint)
//   - item_id: ID numerik item dalam game (u64)
//   - item_type: Tipe item (String)
//   - rarity: Tingkat kelangkaan (String)
//   - blob_id: Metadata / blob reference (String)
//   - supply: Opsional, batas supply (Option<u64>)
//   - recipient: Alamat penerima item
//   - ctx: Context transaksi
// Output: Objek GameItem (harus di-transfer ke recipient oleh pemanggil)
public fun mint(
    game: &mut Game,
    _cap: &GameCapability,
    item_id: u64,
    item_type: String,
    rarity: String,
    blob_id: String,
    supply: Option<u64>,
    recipient: address,
    ctx: &mut TxContext,
): GameItem {
    // Cek apakah item_id ini sudah pernah di-mint untuk game ini
    assert!(!contains_minted_item(game, item_id), EITEM_EXISTS);
    // Catat item_id ke daftar minted_items supaya tidak bisa di-mint dua kali
    add_minted_item(game, item_id);

    // Buat objek GameItem baru dengan semua data dari parameter
    let item = GameItem {
        id: object::new(ctx),   // Buat UID baru — setiap objek Sui butuh ID unik
        game_id: game_id(game), // Ambil ID game dari objek Game (via fungsi accessor)
        item_id,                // ID item dalam game (shorthand: item_id: item_id)
        item_type,              // Tipe item (shorthand)
        rarity,                 // Rarity item (shorthand)
        blob_id,                // Metadata reference (shorthand)
        supply,                 // Batas supply (shorthand)
    };
    let item_obj_id = object::id(&item);  // Ambil ID objek Sui dari item yang baru dibuat
    let game_obj_id = game_id(game);      // Ambil ID game (untuk event)
    let blob = item.blob_id;              // Copy blob_id untuk event (String di-copy, bukan reference)
    // Kirim event ItemMinted ke blockchain
    event::emit(ItemMinted { item_id: item_obj_id, game_id: game_obj_id, recipient, blob_id: blob });
    item  // Kembalikan objek GameItem ke pemanggil
}

// FUNGSI: burn
// Apa yang dilakukan: Menghancurkan (burn) sebuah GameItem. Item di-destructure,
//                ID-nya dihapus, dan item_id dihapus dari daftar minted_items game.
// Siapa yang bisa panggil: Platform (pemegang GameCapability).
// Alur:
//   1. Cek apakah item.game_id cocok dengan game yang disebutkan
//   2. Catat item_obj_id dan game_obj_id sebelum item di-destructure
//   3. Destructure item → ambil semua field, buang yang tidak dipakai
//   4. Panggil id.delete() untuk menghapus UID (ini menghancurkan objek di blockchain)
//   5. Hapus item_id dari daftar minted_items game (supaya bisa di-mint lagi nanti)
//   6. Kirim event ItemBurned
// Parameter:
//   - item: Objek GameItem (by value — akan di-destructure dan dihancurkan)
//   - game: Mutable reference ke Game (untuk update daftar minted_items)
//   - _cap: Reference ke GameCapability (guard — otorisasi platform)
public fun burn(
    item: GameItem,
    game: &mut Game,
    _cap: &GameCapability,
) {
    // Verifikasi bahwa item ini benar-benar milik game yang disebutkan
    assert!(item.game_id == game_id(game), EITEM_GAME_MISMATCH);
    let item_obj_id = object::id(&item);   // Simpan ID objek item sebelum di-destructure
    let game_obj_id = game_id(game);        // Simpan ID game
    // Destructure GameItem: ambil id dan item_id untuk dipakai, sisanya diabaikan (pakai _)
    let GameItem { id, game_id: _, item_id, item_type: _, rarity: _, blob_id: _, supply: _ } = item;
    id.delete();                            // Hapus UID → objek dianggap "burned" / dihancurkan
    remove_minted_item(game, item_id);      // Hapus item_id dari daftar, jadi bisa di-mint ulang
    // Kirim event ItemBurned
    event::emit(ItemBurned { item_id: item_obj_id, game_id: game_obj_id });
}
