module morita::registry;

// ============================================================
// MODULE: registry
// Deskripsi: Module ini berfungsi sebagai "pusat registrasi" untuk
// publisher dan game di platform Morita. Module ini mengelola siapa
// yang boleh menerbitkan game (publisher), data game itu sendiri,
// serta status active/paused dari setiap game.
// ============================================================

use std::string::String;
use sui::event;
use sui::object::{Self, ID, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::TxContext;

// ── Struct: AdminCap ──
// Representasi: "Kunci admin" — hanya dimiliki oleh pemilik kontrak.
// Digunakan untuk memverifikasi publisher, pause/resume game.
// Hanya orang yang punya objek ini yang bisa melakukan aksi admin.
public struct AdminCap has key, store { id: UID }

// ── Struct: Publisher ──
// Representasi: Seorang penerbit game di platform.
// Setiap publisher punya nama, alamat owner, dan status verified.
// Publisher harus diverifikasi oleh admin sebelum bisa publish game.
public struct Publisher has key, store {
    id: UID,               // ID unik objek Publisher ini di Sui
    name: String,           // Nama publisher (misal: "Morita Studio")
    owner: address,         // Alamat wallet yang memiliki publisher ini
    is_verified: bool,      // Apakah sudah diverifikasi admin? (true = verified)
}

// ── Struct: Game ──
// Representasi: Sebuah game yang diterbitkan oleh publisher.
// Game bisa active atau paused. Setiap game punya daftar item
// yang sudah di-mint (minted_items), disimpan sebagai Table.
public struct Game has key, store {
    id: UID,                // ID unik objek Game ini di Sui
    name: String,           // Nama game (misal: "Overworld Saga")
    publisher_id: ID,       // ID publisher yang menerbitkan game ini
    created_at: u64,        // Timestamp (ms) ketika game dibuat
    is_active: bool,        // Apakah game masih aktif? false = paused
    minted_items: Table<u64, bool>,  // Daftar item_id yang sudah di-mint (key = item_id, value = true)
}

// ── Struct: GameCapability ──
// Representasi: "Izin" untuk mengelola item dalam suatu game.
// Diberikan ke platform (bukan publisher) saat finalize_publish.
// Digunakan oleh module item untuk memverifikasi bahwa yang mint/burn
// item adalah platform yang berwenang.
public struct GameCapability has key, store {
    id: UID,                // ID unik objek capability ini
    game_id: ID,            // ID game yang di-capability-kan
}

// ── Struct: PublishTicket ──
// Representasi: "Tiket" sementara yang dipakai dalam proses publish dua-langkah.
// Langkah 1: initiate_publish → menghasilkan Game + PublishTicket.
// Langkah 2: finalize_publish → menerima ticket + Game, membagikan Game ke publik.
// Ticket ini tidak punya 'key' atau 'store' → bersifat transien, tidak bisa disimpan.
public struct PublishTicket {
    game_id: ID,            // ID game yang akan difinalisasi
    publisher_id: ID,       // ID publisher yang menerbitkan
}

// ── Events ──
// Event direkam di blockchain agar frontend / indexer bisa mendeteksi
// apa yang terjadi tanpa perlu membaca state langsung.

// Dikirim ketika publisher baru dibuat
public struct PublisherCreated has copy, drop {
    publisher_id: ID,       // ID publisher yang baru dibuat
    owner: address,         // Alamat wallet pemilik publisher
    name: String,           // Nama publisher
}

// Dikirim ketika game baru dibuat (masih dalam tahap initiate)
public struct GameCreated has copy, drop {
    game_id: ID,            // ID game
    publisher_id: ID,       // ID publisher pembuat
    name: String,           // Nama game
}

// Dikirim ketika game sudah di-share ke publik (finalize_publish)
public struct GameShared has copy, drop {
    game_id: ID,            // ID game
    publisher_id: ID,       // ID publisher
    platform_addr: address, // Alamat platform yang menerima GameCapability
}

// Dikirim ketika nama game diubah (update_game)
public struct GameUpdated has copy, drop {
    game_id: ID,            // ID game yang diupdate
    new_name: String,       // Nama baru game
}

// Dikirim ketika publisher diverifikasi oleh admin
public struct PublisherVerified has copy, drop {
    publisher_id: ID,       // ID publisher yang diverifikasi
}

// Dikirim ketika game di-pause oleh admin
public struct GamePaused has copy, drop {
    game_id: ID,            // ID game yang di-pause
}

// Dikirim ketika game di-resume oleh admin
public struct GameResumed has copy, drop {
    game_id: ID,            // ID game yang di-resume
}

// ── Errors ──
// Kode error yang dipakai saat assert! gagal.
// #[error] membuat error message bisa dibaca manusia.

#[error]
const EUNAUTHORIZED: vector<u8> = b"Not authorized";           // Dipanggil ketika pengguna tidak punya hak akses

#[error]
const ETICKET_MISMATCH: vector<u8> = b"PublishTicket does not correspond to this Game";  // ID game di ticket tidak cocok

#[error]
const EGAME_PAUSED: vector<u8> = b"Game is paused";            // Game sedang paused, tidak bisa diupdate

// ── Public accessors for minted_items (cross-module access) ──
// Fungsi-fungsi ini dibuat public agar module lain (seperti item.move)
// bisa mengakses table minted_items milik Game. Tanpa ini, module lain
// tidak bisa membaca/mengubah field minted_items karena bersifat private.

// Mengecek apakah suatu item_id sudah pernah di-mint untuk game ini.
// Mengembalikan true jika item_id ada di dalam table minted_items.
public fun contains_minted_item(game: &Game, item_id: u64): bool {
    table::contains(&game.minted_items, item_id)  // Panggil fungsi contains dari module table
}

// Menambahkan item_id ke daftar minted_items setelah berhasil di-mint.
// Ini mencegah item_id yang sama di-mint dua kali.
public fun add_minted_item(game: &mut Game, item_id: u64) {
    table::add(&mut game.minted_items, item_id, true);  // Masukkan item_id dengan value 'true' (sebagai flag)
}

// Menghapus item_id dari daftar minted_items ketika item di-burn.
// Artinya item_id tersebut bisa di-mint lagi nanti.
public fun remove_minted_item(game: &mut Game, item_id: u64) {
    table::remove(&mut game.minted_items, item_id);  // Hapus entry item_id dari table
}

// Mengembalikan ID unik dari objek Game.
// Fungsi ini dibutuhkan module item untuk mendapatkan game_id dari referensi Game.
public fun game_id(game: &Game): ID {
    object::id(game)  // Panggil object::id() untuk mengambil ID dari objek
}

// ── Functions ──

// FUNGSI: create_publisher
// Apa yang dilakukan: Membuat objek Publisher baru.
// Siapa yang bisa panggil: Siapa saja (siapa pun bisa jadi publisher).
// Alur: Pengguna memanggil fungsi ini → Publisher baru dibuat → event PublisherCreated dikirim.
// Parameter:
//   - name: Nama publisher (String)
//   - ctx: Context transaksi (berisi info pengirim, timestamp, dll)
// Output: Objek Publisher — harus di-transfer ke pengirim oleh caller.
public fun create_publisher(name: String, ctx: &mut TxContext): Publisher {
    let sender = ctx.sender();  // Ambil alamat wallet pengirim transaksi
    let publisher = Publisher {  // Buat struct Publisher baru
        id: object::new(ctx),   // Buat UID baru untuk objek ini (setiap objek Sui butuh UID unik)
        name,                   // Isi field name dengan parameter name (field shorthand, sama dengan name: name)
        owner: sender,          // Owner adalah alamat pengirim
        is_verified: false,     // Publisher baru belum diverifikasi (perlu admin approve)
    };
    event::emit(PublisherCreated {  // Kirim event ke blockchain biar terlihat di explorer
        publisher_id: object::id(&publisher),  // ID publisher yang baru dibuat
        owner: sender,                          // Alamat pemilik
        name: publisher.name,                   // Nama publisher (copy dari struct)
    });
    publisher  // Kembalikan objek Publisher ke pemanggil
}

// FUNGSI: verify_publisher
// Apa yang dilakukan: Menandai publisher sebagai "terverifikasi" via event (tanpa mengubah field is_verified).
//                CATATAN: Fungsi ini hanya mengirim event, TIDAK mengubah is_verified di struct Publisher.
//                Ini kemungkinan desain yang perlu diperbaiki — idealnya field is_verified di-set ke true.
// Siapa yang bisa panggil: Admin (harus punya AdminCap).
// Parameter:
//   - publisher_id: ID publisher yang akan diverifikasi
//   - _admin: Reference ke AdminCap (tidak dipakai di body, hanya sebagai guard — siapa pun yang punya AdminCap bisa panggil)
//   - _ctx: Context (tidak dipakai)
public fun verify_publisher(publisher_id: ID, _admin: &AdminCap, _ctx: &mut TxContext) {
    event::emit(PublisherVerified { publisher_id });  // Kirim event bahwa publisher sudah diverifikasi
}

// FUNGSI: initiate_publish
// Apa yang dilakukan: Langkah 1 dari 2-step publish. Membuat objek Game dan PublishTicket.
//                Game dibuat dengan status is_active = true. Publisher harus memiliki publisher.owner sesuai sender.
// Siapa yang bisa panggil: Publisher (owner dari objek Publisher).
// Parameter:
//   - publisher: Reference ke objek Publisher milik pengirim
//   - name: Nama game yang akan dibuat
//   - ctx: Context transaksi
// Output: Tuple (Game, PublishTicket) — Game dan ticket untuk langkah finalisasi.
public fun initiate_publish(publisher: &Publisher, name: String, ctx: &mut TxContext): (Game, PublishTicket) {
    assert!(publisher.owner == ctx.sender(), EUNAUTHORIZED);  // Cek: apakah pengirim adalah owner publisher? Jika tidak, gagal.
    let game = Game {                      // Buat struct Game baru
        id: object::new(ctx),             // UID unik untuk game ini
        name,                              // Nama game dari parameter
        publisher_id: object::id(publisher),  // Simpan ID publisher sebagai referensi
        created_at: ctx.epoch_timestamp_ms(), // Catat waktu pembuatan dalam milidetik
        is_active: true,                   // Game baru langsung aktif
        minted_items: table::new(ctx),     // Buat Table kosong untuk mencatat item yang di-mint
    };
    let ticket = PublishTicket {           // Buat ticket publish sementara
        game_id: object::id(&game),       // ID game yang baru dibuat
        publisher_id: object::id(publisher),  // ID publisher
    };
    event::emit(GameCreated {              // Kirim event game dibuat
        game_id: object::id(&game),
        publisher_id: object::id(publisher),
        name: game.name,
    });
    (game, ticket)  // Kembalikan kedua objek. Caller harus menyimpan keduanya.
}

// FUNGSI: finalize_publish
// Apa yang dilakukan: Langkah 2 dari 2-step publish. Menerima Game + PublishTicket yang cocok,
//                lalu membagikan Game ke publik (share_object) dan mengirim GameCapability ke platform.
// Siapa yang bisa panggil: Publisher yang memiliki Game dan ticket yang cocok.
// Parameter:
//   - game: Objek Game (by value — akan dikonsumsi/dipindahkan)
//   - ticket: PublishTicket (by value — akan di-destructure)
//   - platform_addr: Alamat wallet platform yang akan menerima GameCapability
//   - ctx: Context transaksi
public fun finalize_publish(game: Game, ticket: PublishTicket, platform_addr: address, ctx: &mut TxContext) {
    assert!(object::id(&game) == ticket.game_id, ETICKET_MISMATCH);  // Cek apakah ticket cocok dengan game ini
    let PublishTicket { game_id: _, publisher_id } = ticket;  // Destructure ticket, ambil publisher_id, buang game_id (pakai _)
    let game_obj_id = object::id(&game);         // Ambil ID game untuk dimasukkan ke capability
    let cap = GameCapability { id: object::new(ctx), game_id: game_obj_id };  // Buat capability untuk game ini
    transfer::share_object(game);                 // Bagikan Game ke publik — semua orang bisa lihat dan akses
    transfer::public_transfer(cap, platform_addr); // Kirim GameCapability ke platform (bukan ke publisher)
    event::emit(GameShared {                      // Kirim event game di-share
        game_id: game_obj_id,
        publisher_id,
        platform_addr,
    });
}

// FUNGSI: update_game
// Apa yang dilakukan: Mengubah nama game. Hanya bisa dilakukan jika game sedang aktif.
// Siapa yang bisa panggil: Publisher (atau siapa pun yang punya reference &mut Game).
// NOTE: Fungsi ini tidak melakukan otorisasi — siapa pun yang bisa mendapatkan &mut Game bisa mengubah nama.
// Parameter:
//   - game: Mutable reference ke Game yang akan diupdate
//   - new_name: Nama baru untuk game
public fun update_game(game: &mut Game, new_name: String) {
    assert!(game.is_active, EGAME_PAUSED);   // Cek: game harus aktif. Jika paused, tolak.
    game.name = new_name;                     // Ganti nama game dengan nama baru
    event::emit(GameUpdated { game_id: object::id(game), new_name });  // Kirim event
}

// FUNGSI: pause_game
// Apa yang dilakukan: Menonaktifkan game (is_active = false). Game yang di-pause tidak bisa di-update.
// Siapa yang bisa panggil: Admin (memegang AdminCap).
// Parameter:
//   - game: Mutable reference ke Game
//   - _admin: Reference ke AdminCap (guard — siapa pun yang punya AdminCap bisa pause game apa pun)
public fun pause_game(game: &mut Game, _admin: &AdminCap) {
    game.is_active = false;                    // Set game ke non-aktif
    event::emit(GamePaused { game_id: object::id(game) });  // Kirim event
}

// FUNGSI: resume_game
// Apa yang dilakukan: Mengaktifkan kembali game (is_active = true) setelah di-pause.
// Siapa yang bisa panggil: Admin (memegang AdminCap).
// Parameter:
//   - game: Mutable reference ke Game
//   - _admin: Reference ke AdminCap (guard)
public fun resume_game(game: &mut Game, _admin: &AdminCap) {
    game.is_active = true;                     // Set game kembali aktif
    event::emit(GameResumed { game_id: object::id(game) });  // Kirim event
}
