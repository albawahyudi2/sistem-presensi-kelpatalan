# Diagram Terbaru (selaras PRD v3.5 dan OpenSpec)

Menggantikan `erd.jpg`, `dfd level 1.drawio.png`, dan `usecase diagram.drawio.png` yang belum memuat Lokasi, Holiday, Dinas Luar, Izin/Sakit, Verifikasi, dan Offline. DFD level 0 masih berlaku. Render dengan Mermaid (VS Code, mermaid.live, atau draw.io via Insert > Advanced > Mermaid).

## 1. ERD

```mermaid
erDiagram
    LOCATION ||--o{ USER_LOCATION : "ditugaskan"
    USER ||--o{ USER_LOCATION : "memiliki lokasi"
    USER ||--o{ ATTENDANCE : "melakukan"
    USER ||--o{ LEAVE : "memiliki"
    LOCATION ||--o{ ATTENDANCE : "lokasi cocok"
    ADMIN ||--o{ ATTENDANCE : "memutuskan Dinas Luar"
    ADMIN ||--o{ LEAVE : "mencatat"

    ADMIN {
        string id PK
        string username UK
        string name
        string passwordHash
        boolean mustChangePassword
        boolean isActive
    }
    USER_LOCATION {
        string userId FK
        string locationId FK
    }

    LOCATION {
        string id PK
        string name
        float latitude
        float longitude
        int radius "50-150 m"
    }
    USER {
        string id PK
        string nip UK
        string name
        string position
        string passwordHash
        boolean mustChangePassword
        boolean isActive
    }
    ATTENDANCE {
        string id PK
        string userId FK
        string type "IN | OUT"
        string category "HADIR | DINAS_LUAR"
        float latitude
        float longitude
        string locationId FK
        float gpsAccuracy
        float distanceMeters
        string photoUrl "null pada OUT"
        string deviceSignature
        string status "ON_TIME | LATE | PENDING_APPROVAL | APPROVED | REJECTED"
        int lateMinutes
        boolean isOfflineSync
        datetime capturedAt
        datetime timestamp
        string idempotencyKey UK
        string decidedBy FK
        datetime decidedAt
    }
    LEAVE {
        string id PK
        string userId FK
        date date
        string kind "IZIN | SAKIT"
        string createdBy FK
    }
    HOLIDAY {
        string id PK
        string name
        date date
        boolean isRecurring
    }
```

## 2. DFD Level 1

```mermaid
flowchart LR
    P[Pegawai]
    A[Admin Kelurahan]

    P1((1.0 Autentikasi))
    P2((2.0 Presensi GPS dan Selfie))
    P3((3.0 Manajemen Data Master))
    P4((4.0 Verifikasi dan Audit))
    P5((5.0 Laporan dan Live Map))
    P6((6.0 Sinkronisasi Offline))

    D1[(D1 data_pegawai)]
    D2[(D2 data_lokasi)]
    D3[(D3 data_presensi)]
    D4[(D4 hari_libur)]
    D5[(D5 izin_sakit)]
    CL[(Cloudinary foto)]

    P -- "NIP dan password" --> P1
    P1 -- "Validasi kredensial" --> D1
    P1 -- "Sesi dan status ganti password" --> P
    P -- "Koordinat GPS, selfie, kategori" --> P2
    D1 -- "Lokasi penugasan" --> P2
    D2 -- "Titik dan radius" --> P2
    D4 -- "Cek hari kerja" --> P2
    P2 -- "Simpan presensi" --> D3
    P2 -- "Unggah foto" --> CL
    P2 -- "Status dan notifikasi" --> P
    P -- "Antrean presensi offline" --> P6
    P6 -- "Presensi tervalidasi" --> P2

    A -- "Data pegawai, lokasi, libur, izin/sakit" --> P3
    P3 --> D1
    P3 --> D2
    P3 --> D4
    P3 --> D5
    D3 -- "Dinas Luar pending, foto" --> P4
    CL --> P4
    A -- "Approve atau Reject" --> P4
    P4 -- "Keputusan" --> D3
    D3 --> P5
    D5 --> P5
    D4 --> P5
    D1 --> P5
    A -- "Filter laporan" --> P5
    P5 -- "Excel, dashboard, Live Map" --> A
```

## 3. Use Case

```mermaid
flowchart LR
    P([Pegawai])
    A([Admin Kelurahan])

    subgraph SISTEM[Sistem Presensi Geospasial Patalan]
        U1(Login)
        U2(Ganti Password Wajib)
        U3(Clock In GPS dan Selfie)
        U4(Clock Out GPS)
        U5(Presensi Dinas Luar)
        U6(Lihat Riwayat Pribadi)
        U7(Kelola Pegawai)
        U8(Kelola Lokasi)
        U9(Kelola Hari Libur)
        U10(Catat Izin atau Sakit)
        U11(Verifikasi Dinas Luar)
        U12(Audit Foto dan Perangkat)
        U13(Pantau Live Map)
        U14(Export Laporan Excel)
        U15(Sinkronisasi Offline)
    end

    P --- U1
    P --- U2
    P --- U3
    P --- U4
    P --- U5
    P --- U6
    A --- U1
    A --- U7
    A --- U8
    A --- U9
    A --- U10
    A --- U11
    A --- U12
    A --- U13
    A --- U14
    U3 -. include .-> U15
    U4 -. include .-> U15
    U5 -. include .-> U15
```
