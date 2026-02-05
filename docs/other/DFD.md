# Data Flow Diagram (DFD) - Chit-Chat V5.1 AI

> **Dokumentasi DFD Lengkap untuk Sistem Chit-Chat V5.1 AI**
>
> Diagram ini menunjukkan alur data lengkap dalam sistem, dari Level 0 (Context Diagram) hingga Level 2 (Detail Process).

---

## 📊 DFD Level 0: Context Diagram

**Context Diagram** menunjukkan sistem sebagai satu proses tunggal dengan interaksi ke entitas eksternal.

```mermaid
flowchart TD
    %% External Entities
    User([👤 User / Pengguna])
    Admin([👨‍💼 Admin])
    EmailSystem([📧 Email System / SMTP])
    AISystem([🤖 AI Service / Gemini LLM])

    %% Main System
    System((Chit-Chat V5.1 AI<br/>System))

    %% User Interactions
    User -->|Login Credentials<br/>Registration Data<br/>Profile Updates| System
    User -->|Friend Requests<br/>Messages<br/>Room Creation| System
    System -->|Authentication Token<br/>Chat History<br/>Friend List| User
    System -->|Notifications<br/>Online Status<br/>Room Updates| User

    %% Admin Interactions
    Admin -->|Admin Passkey<br/>Management Commands<br/>Review Actions| System
    System -->|Dashboard Stats<br/>User Reports<br/>System Logs| Admin
    System -->|Moderation Actions| Admin

    %% Email System
    System -->|Verification Email<br/>OTP Codes<br/>Password Reset| EmailSystem
    EmailSystem -->|Delivery Status| System

    %% AI System
    System -->|User Prompt<br/>Conversation Context| AISystem
    AISystem -->|AI Response<br/>Generated Content| System

    style System fill:#4a90e2,stroke:#2c5aa0,stroke-width:3px,color:#fff
    style User fill:#34c759,stroke:#248a3d,stroke-width:2px,color:#fff
    style Admin fill:#ff9500,stroke:#cc7700,stroke-width:2px,color:#fff
    style EmailSystem fill:#af52de,stroke:#8e44ad,stroke-width:2px,color:#fff
    style AISystem fill:#ff375f,stroke:#cc2b4c,stroke-width:2px,color:#fff
```

---

## 📋 DFD Level 1: Major Processes

**Level 1** memecah sistem menjadi 7 proses utama dengan data stores.

```mermaid
flowchart TD
    %% External Entities
    User([👤 User])
    Admin([👨‍💼 Admin])
    EmailSystem([📧 Email System])
    AISystem([🤖 AI System])

    %% Main Processes
    P1((1.0<br/>Authentication &<br/>Authorization))
    P2((2.0<br/>User Profile<br/>Management))
    P3((3.0<br/>Friendship<br/>Management))
    P4((4.0<br/>Room<br/>Management))
    P5((5.0<br/>Message<br/>Management))
    P6((6.0<br/>AI Chat<br/>Integration))
    P7((7.0<br/>Admin<br/>Management))

    %% Data Stores
    DS_Users[(Users<br/>Collection)]
    DS_Passkeys[(Passkeys<br/>Collection)]
    DS_Friendships[(Friendships<br/>Collection)]
    DS_Rooms[(Rooms<br/>Collection)]
    DS_Messages[(Messages<br/>Collection)]

    %% === PROCESS 1: AUTHENTICATION ===
    User -->|Login/Register Data| P1
    P1 -->|Create/Verify User| DS_Users
    DS_Users -->|User Exists?| P1
    P1 -->|Store Passkey| DS_Passkeys
    DS_Passkeys -->|Verify Passkey| P1
    P1 -->|Send Verification Email| EmailSystem
    EmailSystem -->|Delivery Status| P1
    P1 -->|Session Token/Auth Status| User

    %% === PROCESS 2: USER PROFILE ===
    User -->|Profile Updates<br/>Avatar/Banner Upload| P2
    P2 -->|Update User Info| DS_Users
    DS_Users -->|Current Profile| P2
    P2 -->|Updated Profile| User

    %% === PROCESS 3: FRIENDSHIP ===
    User -->|Add Friend<br/>Accept/Reject Request| P3
    P3 -->|Check User Exists| DS_Users
    DS_Users -->|User Info| P3
    P3 -->|Create/Update Friendship| DS_Friendships
    DS_Friendships -->|Friendship Status| P3
    P3 -->|Create Private Room| DS_Rooms
    P3 -->|Friend List Update| User

    %% === PROCESS 4: ROOM MANAGEMENT ===
    User -->|Create Room<br/>Join/Leave| P4
    P4 -->|Verify Friendship| DS_Friendships
    P4 -->|Create/Update Room| DS_Rooms
    DS_Rooms -->|Room Info| P4
    P4 -->|Room List/Details| User

    %% === PROCESS 5: MESSAGE MANAGEMENT ===
    User -->|Send Message<br/>Read Receipt| P5
    P5 -->|Validate Room Access| DS_Rooms
    P5 -->|Save Message| DS_Messages
    DS_Messages -->|Message History| P5
    P5 -->|Update Last Activity| DS_Rooms
    P5 -->|Broadcast Message| User

    %% === PROCESS 6: AI INTEGRATION ===
    User -->|AI Chat Request| P6
    P6 -->|Get Conversation Context| DS_Messages
    P6 -->|Send Prompt| AISystem
    AISystem -->|AI Response| P6
    P6 -->|Save AI Message| DS_Messages
    P6 -->|AI Reply| User

    %% === PROCESS 7: ADMIN MANAGEMENT ===
    Admin -->|Login with Passkey<br/>Management Commands| P7
    P7 -->|Verify Admin Passkey| DS_Passkeys
    P7 -->|Read/Update Users| DS_Users
    DS_Users -->|User Stats| P7
    DS_Messages -->|Message Stats| P7
    DS_Rooms -->|Room Stats| P7
    P7 -->|Dashboard Data<br/>Action Results| Admin

    %% Styling
    style P1 fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px,color:#fff
    style P2 fill:#4ecdc4,stroke:#0c9488,stroke-width:2px,color:#fff
    style P3 fill:#45b7d1,stroke:#0077b6,stroke-width:2px,color:#fff
    style P4 fill:#f9ca24,stroke:#f0932b,stroke-width:2px,color:#000
    style P5 fill:#6c5ce7,stroke:#5f27cd,stroke-width:2px,color:#fff
    style P6 fill:#a29bfe,stroke:#6c5ce7,stroke-width:2px,color:#fff
    style P7 fill:#fd79a8,stroke:#e84393,stroke-width:2px,color:#fff

    style DS_Users fill:#2d3436,stroke:#636e72,stroke-width:2px,color:#fff
    style DS_Passkeys fill:#2d3436,stroke:#636e72,stroke-width:2px,color:#fff
    style DS_Friendships fill:#2d3436,stroke:#636e72,stroke-width:2px,color:#fff
    style DS_Rooms fill:#2d3436,stroke:#636e72,stroke-width:2px,color:#fff
    style DS_Messages fill:#2d3436,stroke:#636e72,stroke-width:2px,color:#fff
```

---

## 🔍 DFD Level 2: Detailed Sub-Processes

### 2.1 Authentication & Authorization (Detail)

```mermaid
flowchart TD
    %% External Entity
    User([User])
    EmailSystem([Email System])

    %% Sub-Processes
    P1_1((1.1 Register))
    P1_2((1.2 Login Standard))
    P1_3((1.3 Login Passkey))
    P1_4((1.4 Email Verification))
    P1_5((1.5 Password Reset))
    P1_6((1.6 Manage Passkeys))

    %% Data Stores
    DS_Users[(Users)]
    DS_Passkeys[(Passkeys)]

    %% === 1.1 REGISTER ===
    User -->|Username, Email, Password, DisplayName| P1_1
    P1_1 -->|Check Duplicate| DS_Users
    DS_Users -->|Email/Username Exists?| P1_1
    P1_1 -->|Hash Password, Create User| DS_Users
    P1_1 -->|Generate Verification Token| P1_4
    P1_1 -->|Registration Success, User ID| User

    %% === 1.2 LOGIN STANDARD ===
    User -->|Email/Username, Password| P1_2
    P1_2 -->|Fetch User| DS_Users
    DS_Users -->|Hashed Password, User Data| P1_2
    P1_2 -->|Verify Password, Update isOnline| DS_Users
    P1_2 -->|Session Token, User Profile| User

    %% === 1.3 LOGIN PASSKEY ===
    User -->|Passkey Challenge Response| P1_3
    P1_3 -->|Get Public Key| DS_Passkeys
    DS_Passkeys -->|Public Key, Counter| P1_3
    P1_3 -->|Verify Signature, Update Counter| DS_Passkeys
    P1_3 -->|Get User Data| DS_Users
    P1_3 -->|Session Token| User

    %% === 1.4 EMAIL VERIFICATION ===
    P1_4 -->|Send Verification Link/OTP| EmailSystem
    User -->|Click Link / Enter OTP| P1_4
    P1_4 -->|Verify Token, Set isVerified| DS_Users
    P1_4 -->|Verification Success| User

    %% === 1.5 PASSWORD RESET ===
    User -->|Request Reset, Email| P1_5
    P1_5 -->|Check User Exists| DS_Users
    P1_5 -->|Generate OTP, Set Expiry| DS_Users
    P1_5 -->|Send OTP Email| EmailSystem
    User -->|OTP + New Password| P1_5
    P1_5 -->|Verify OTP, Update Password| DS_Users
    P1_5 -->|Reset Success| User

    %% === 1.6 MANAGE PASSKEYS ===
    User -->|Register New Passkey| P1_6
    P1_6 -->|Store Credential ID, Public Key| DS_Passkeys
    User -->|List Passkeys| P1_6
    P1_6 -->|Fetch User Passkeys| DS_Passkeys
    DS_Passkeys -->|Passkey List| P1_6
    P1_6 -->|Passkey List| User

    %% Styling
    style P1_1 fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px,color:#fff
    style P1_2 fill:#ff8787,stroke:#c92a2a,stroke-width:2px,color:#fff
    style P1_3 fill:#ffa5a5,stroke:#c92a2a,stroke-width:2px,color:#fff
    style P1_4 fill:#ffc9c9,stroke:#c92a2a,stroke-width:2px,color:#fff
    style P1_5 fill:#ffe3e3,stroke:#c92a2a,stroke-width:2px,color:#000
    style P1_6 fill:#fff0f0,stroke:#c92a2a,stroke-width:2px,color:#000
```

---

### 2.2 User Profile Management (Detail)

```mermaid
flowchart TD
    %% External Entity
    User([User])

    %% Sub-Processes
    P2_1((2.1 View Profile))
    P2_2((2.2 Update Profile))
    P2_3((2.3 Upload Avatar))
    P2_4((2.4 Upload Banner))
    P2_5((2.5 Change Password))
    P2_6((2.6 Search Users))

    %% Data Store
    DS_Users[(Users)]

    %% === 2.1 VIEW PROFILE ===
    User -->|Request Profile, User ID| P2_1
    P2_1 -->|Fetch User Data| DS_Users
    DS_Users -->|Profile Data| P2_1
    P2_1 -->|Display Profile| User

    %% === 2.2 UPDATE PROFILE ===
    User -->|DisplayName, Bio| P2_2
    P2_2 -->|Validate Data, Update Fields| DS_Users
    P2_2 -->|Updated Profile| User

    %% === 2.3 UPLOAD AVATAR ===
    User -->|Avatar Image File| P2_3
    P2_3 -->|Validate, Crop 1:1, Save| P2_3
    P2_3 -->|Update avatar URL| DS_Users
    P2_3 -->|New Avatar URL| User

    %% === 2.4 UPLOAD BANNER ===
    User -->|Banner Image File| P2_4
    P2_4 -->|Validate, Crop 16:9, Save| P2_4
    P2_4 -->|Update banner URL| DS_Users
    P2_4 -->|New Banner URL| User

    %% === 2.5 CHANGE PASSWORD ===
    User -->|Current Password, New Password| P2_5
    P2_5 -->|Fetch User| DS_Users
    DS_Users -->|Current Hash| P2_5
    P2_5 -->|Verify, Hash, Update| DS_Users
    P2_5 -->|Password Changed| User

    %% === 2.6 SEARCH USERS ===
    User -->|Search Query| P2_6
    P2_6 -->|Search by Username/DisplayName| DS_Users
    DS_Users -->|Matching Users| P2_6
    P2_6 -->|Search Results| User

    style P2_1 fill:#4ecdc4,stroke:#0c9488,stroke-width:2px,color:#fff
    style P2_2 fill:#56cfe1,stroke:#0c9488,stroke-width:2px,color:#fff
    style P2_3 fill:#64dfdf,stroke:#0c9488,stroke-width:2px,color:#fff
    style P2_4 fill:#72efdd,stroke:#0c9488,stroke-width:2px,color:#000
    style P2_5 fill:#80ffdb,stroke:#0c9488,stroke-width:2px,color:#000
    style P2_6 fill:#caffbf,stroke:#0c9488,stroke-width:2px,color:#000
```

---

### 2.3 Friendship Management (Detail)

```mermaid
flowchart TD
    %% External Entity
    User([User])

    %% Sub-Processes
    P3_1((3.1 Send Request))
    P3_2((3.2 Accept Request))
    P3_3((3.3 Reject Request))
    P3_4((3.4 Get Friend List))
    P3_5((3.5 Block User))
    P3_6((3.6 Remove Friend))

    %% Data Stores
    DS_Users[(Users)]
    DS_Friendships[(Friendships)]
    DS_Rooms[(Rooms)]

    %% === 3.1 SEND FRIEND REQUEST ===
    User -->|Target Username/Email| P3_1
    P3_1 -->|Search User| DS_Users
    DS_Users -->|Target User ID| P3_1
    P3_1 -->|Check Existing Friendship| DS_Friendships
    DS_Friendships -->|Already Friends?| P3_1
    P3_1 -->|Create Friendship, Status=Pending| DS_Friendships
    P3_1 -->|Request Sent| User

    %% === 3.2 ACCEPT REQUEST ===
    User -->|Friendship ID, Action: Accept| P3_2
    P3_2 -->|Verify Receiver| DS_Friendships
    DS_Friendships -->|Friendship Data| P3_2
    P3_2 -->|Update Status=Accepted| DS_Friendships
    P3_2 -->|Create Private Room| DS_Rooms
    P3_2 -->|Friend Added, Room Created| User

    %% === 3.3 REJECT REQUEST ===
    User -->|Friendship ID, Action: Reject| P3_3
    P3_3 -->|Verify Receiver| DS_Friendships
    P3_3 -->|Update Status=Rejected| DS_Friendships
    P3_3 -->|Request Rejected| User

    %% === 3.4 GET FRIEND LIST ===
    User -->|Get Friends| P3_4
    P3_4 -->|Fetch All Friendships| DS_Friendships
    DS_Friendships -->|Friendships Data| P3_4
    P3_4 -->|Get Friend Details| DS_Users
    DS_Users -->|User Profiles| P3_4
    P3_4 -->|Friends List, Pending| User

    %% === 3.5 BLOCK USER ===
    User -->|Block User ID| P3_5
    P3_5 -->|Update/Create, Status=Blocked| DS_Friendships
    P3_5 -->|User Blocked| User

    %% === 3.6 REMOVE FRIEND ===
    User -->|Friendship ID| P3_6
    P3_6 -->|Delete Friendship| DS_Friendships
    P3_6 -->|Friend Removed| User

    style P3_1 fill:#45b7d1,stroke:#0077b6,stroke-width:2px,color:#fff
    style P3_2 fill:#5fc9e2,stroke:#0077b6,stroke-width:2px,color:#fff
    style P3_3 fill:#79dbf3,stroke:#0077b6,stroke-width:2px,color:#fff
    style P3_4 fill:#93edff,stroke:#0077b6,stroke-width:2px,color:#000
    style P3_5 fill:#adffff,stroke:#0077b6,stroke-width:2px,color:#000
    style P3_6 fill:#c7ffff,stroke:#0077b6,stroke-width:2px,color:#000
```

---

### 2.4 Room Management (Detail)

```mermaid
flowchart TD
    %% External Entity
    User([User])

    %% Sub-Processes
    P4_1((4.1 Create Private))
    P4_2((4.2 Create Group))
    P4_3((4.3 Create AI Room))
    P4_4((4.4 Get Room List))
    P4_5((4.5 Get by Slug))
    P4_6((4.6 Update Room))
    P4_7((4.7 Manage Members))
    P4_8((4.8 Leave Room))

    %% Data Stores
    DS_Rooms[(Rooms)]
    DS_Friendships[(Friendships)]
    DS_Users[(Users)]

    %% === 4.1 CREATE PRIVATE ROOM ===
    User -->|Friend User ID| P4_1
    P4_1 -->|Check Friendship Status| DS_Friendships
    DS_Friendships -->|Must be Friends| P4_1
    P4_1 -->|Get Friend Name| DS_Users
    P4_1 -->|Check Existing Room| DS_Rooms
    DS_Rooms -->|Room Exists?| P4_1
    P4_1 -->|Create Room Type=private| DS_Rooms
    P4_1 -->|Room Created| User

    %% === 4.2 CREATE GROUP ROOM ===
    User -->|Room Name, Members, Description| P4_2
    P4_2 -->|Validate Members Exist| DS_Users
    P4_2 -->|Create Room Type=group| DS_Rooms
    P4_2 -->|Group Created| User

    %% === 4.3 CREATE AI ROOM ===
    User -->|Request AI Chat| P4_3
    P4_3 -->|Check Existing AI Room| DS_Rooms
    P4_3 -->|Create Room Type=ai| DS_Rooms
    P4_3 -->|AI Room Created| User

    %% === 4.4 GET ROOM LIST ===
    User -->|Get All Rooms| P4_4
    P4_4 -->|Fetch Rooms by Member| DS_Rooms
    DS_Rooms -->|Room List| P4_4
    P4_4 -->|Get Member Details| DS_Users
    P4_4 -->|Rooms with Details| User

    %% === 4.5 GET ROOM BY SLUG ===
    User -->|Room Slug| P4_5
    P4_5 -->|Find User if username| DS_Users
    P4_5 -->|Find Private Room| DS_Rooms
    DS_Rooms -->|Room Data| P4_5
    P4_5 -->|Room Details| User

    %% === 4.6 UPDATE ROOM INFO ===
    User -->|Room ID, New Info| P4_6
    P4_6 -->|Verify Admin Rights| DS_Rooms
    P4_6 -->|Update Room Fields| DS_Rooms
    P4_6 -->|Room Updated| User

    %% === 4.7 MANAGE MEMBERS ===
    User -->|Add/Remove/Promote Member| P4_7
    P4_7 -->|Verify Admin Rights| DS_Rooms
    P4_7 -->|Update Members Array| DS_Rooms
    P4_7 -->|Members Updated| User

    %% === 4.8 LEAVE ROOM ===
    User -->|Room ID| P4_8
    P4_8 -->|Remove User from Members| DS_Rooms
    P4_8 -->|Left Room| User

    style P4_1 fill:#f9ca24,stroke:#f0932b,stroke-width:2px,color:#000
    style P4_2 fill:#f9e79f,stroke:#f0932b,stroke-width:2px,color:#000
    style P4_3 fill:#fef5c3,stroke:#f0932b,stroke-width:2px,color:#000
    style P4_4 fill:#fff9e6,stroke:#f0932b,stroke-width:2px,color:#000
    style P4_5 fill:#ffedcc,stroke:#f0932b,stroke-width:2px,color:#000
    style P4_6 fill:#ffe1b3,stroke:#f0932b,stroke-width:2px,color:#000
    style P4_7 fill:#ffd599,stroke:#f0932b,stroke-width:2px,color:#000
    style P4_8 fill:#ffc97f,stroke:#f0932b,stroke-width:2px,color:#000
```

---

### 2.5 Message Management (Detail)

```mermaid
flowchart TD
    %% External Entity
    User([User])

    %% Sub-Processes
    P5_1((5.1 Send Text))
    P5_2((5.2 Send Media))
    P5_3((5.3 Get History))
    P5_4((5.4 Edit Message))
    P5_5((5.5 Delete Message))
    P5_6((5.6 Read Receipt))
    P5_7((5.7 Broadcast))

    %% Data Stores
    DS_Rooms[(Rooms)]
    DS_Messages[(Messages)]
    DS_Users[(Users)]

    %% === 5.1 SEND TEXT MESSAGE ===
    User -->|Room ID, Message Text| P5_1
    P5_1 -->|Verify Room Membership| DS_Rooms
    DS_Rooms -->|Is Member?| P5_1
    P5_1 -->|Create Message Type=text| DS_Messages
    P5_1 -->|Update lastMessage| DS_Rooms
    P5_1 -->|Trigger Broadcast| P5_7
    P5_1 -->|Message Sent| User

    %% === 5.2 SEND MEDIA MESSAGE ===
    User -->|Room ID, Image/File| P5_2
    P5_2 -->|Verify Room Membership| DS_Rooms
    P5_2 -->|Upload to Storage, Get URL| P5_2
    P5_2 -->|Create Message Type=media| DS_Messages
    P5_2 -->|Update Room Activity| DS_Rooms
    P5_2 -->|Trigger Broadcast| P5_7
    P5_2 -->|Media Sent| User

    %% === 5.3 GET MESSAGE HISTORY ===
    User -->|Room ID, Limit, Pagination| P5_3
    P5_3 -->|Verify Room Membership| DS_Rooms
    P5_3 -->|Fetch Messages, Sort DESC| DS_Messages
    DS_Messages -->|Message List| P5_3
    P5_3 -->|Get Sender Info| DS_Users
    P5_3 -->|Messages with hasMore| User

    %% === 5.4 EDIT MESSAGE ===
    User -->|Message ID, New Text| P5_4
    P5_4 -->|Verify Ownership| DS_Messages
    P5_4 -->|Update, isEdited=true| DS_Messages
    P5_4 -->|Message Edited| User

    %% === 5.5 DELETE MESSAGE ===
    User -->|Message ID| P5_5
    P5_5 -->|Verify Ownership| DS_Messages
    P5_5 -->|Soft Delete, isDeleted=true| DS_Messages
    P5_5 -->|Message Deleted| User

    %% === 5.6 SEND READ RECEIPT ===
    User -->|Room ID, Last Message ID| P5_6
    P5_6 -->|Store Receipt Data| DS_Messages
    P5_6 -->|Receipt Saved| User

    %% === 5.7 REAL-TIME BROADCAST ===
    P5_7 -->|Get Room Members| DS_Rooms
    P5_7 -->|Format Message Data| DS_Messages
    P5_7 -->|WebSocket Broadcast| User

    style P5_1 fill:#6c5ce7,stroke:#5f27cd,stroke-width:2px,color:#fff
    style P5_2 fill:#7d6fe8,stroke:#5f27cd,stroke-width:2px,color:#fff
    style P5_3 fill:#8e82e9,stroke:#5f27cd,stroke-width:2px,color:#fff
    style P5_4 fill:#9f95ea,stroke:#5f27cd,stroke-width:2px,color:#fff
    style P5_5 fill:#b0a8eb,stroke:#5f27cd,stroke-width:2px,color:#fff
    style P5_6 fill:#c1bbec,stroke:#5f27cd,stroke-width:2px,color:#000
    style P5_7 fill:#d2ceed,stroke:#5f27cd,stroke-width:2px,color:#000
```

---

### 2.6 AI Chat Integration (Detail)

```mermaid
flowchart TD
    %% External Entities
    User([User])
    AISystem([Gemini AI API])

    %% Sub-Processes
    P6_1((6.1 Receive Request))
    P6_2((6.2 Build Context))
    P6_3((6.3 Call AI API))
    P6_4((6.4 Process Response))
    P6_5((6.5 Save & Send))

    %% Data Stores
    DS_Messages[(Messages)]
    DS_Rooms[(Rooms)]
    DS_Users[(Users)]

    %% === 6.1 RECEIVE AI REQUEST ===
    User -->|Message to AI Room| P6_1
    P6_1 -->|Save User Message| DS_Messages
    P6_1 -->|Trigger AI Processing| P6_2

    %% === 6.2 BUILD CONTEXT ===
    P6_2 -->|Fetch Recent Messages| DS_Messages
    DS_Messages -->|Conversation History| P6_2
    P6_2 -->|Get User Profile| DS_Users
    DS_Users -->|User Display Name| P6_2
    P6_2 -->|Build Context, Format| P6_2
    P6_2 -->|Send to AI API| P6_3

    %% === 6.3 CALL AI API ===
    P6_3 -->|Send Prompt + Context| AISystem
    AISystem -->|AI Generated Response| P6_3
    P6_3 -->|Process Response| P6_4

    %% === 6.4 PROCESS AI RESPONSE ===
    P6_4 -->|Validate, Format Text| P6_4
    P6_4 -->|Save AI Message| P6_5

    %% === 6.5 SAVE & SEND AI MESSAGE ===
    P6_5 -->|Create Message from AI| DS_Messages
    P6_5 -->|Update Room Activity| DS_Rooms
    P6_5 -->|Broadcast to User| User
    P6_5 -->|AI Response Received| User

    style P6_1 fill:#a29bfe,stroke:#6c5ce7,stroke-width:2px,color:#fff
    style P6_2 fill:#b3adff,stroke:#6c5ce7,stroke-width:2px,color:#fff
    style P6_3 fill:#c4bfff,stroke:#6c5ce7,stroke-width:2px,color:#000
    style P6_4 fill:#d5d1ff,stroke:#6c5ce7,stroke-width:2px,color:#000
    style P6_5 fill:#e6e3ff,stroke:#6c5ce7,stroke-width:2px,color:#000
```

---

### 2.7 Admin Management (Detail)

```mermaid
flowchart TD
    %% External Entity
    Admin([Admin])

    %% Sub-Processes
    P7_1((7.1 Admin Login))
    P7_2((7.2 Dashboard Stats))
    P7_3((7.3 User Management))
    P7_4((7.4 Report Review))
    P7_5((7.5 Passkey Mgmt))
    P7_6((7.6 Debug User))

    %% Data Stores
    DS_Passkeys[(Passkeys)]
    DS_Users[(Users)]
    DS_Messages[(Messages)]
    DS_Rooms[(Rooms)]
    DS_Friendships[(Friendships)]

    %% === 7.1 ADMIN LOGIN ===
    Admin -->|Passkey Authentication| P7_1
    P7_1 -->|Verify Admin Passkey| DS_Passkeys
    DS_Passkeys -->|Public Key + Counter| P7_1
    P7_1 -->|Validate, Generate Token| P7_1
    P7_1 -->|Admin Session Token| Admin

    %% === 7.2 DASHBOARD STATS ===
    Admin -->|Request Dashboard| P7_2
    P7_2 -->|Count Users Stats| DS_Users
    P7_2 -->|Count Total Messages| DS_Messages
    P7_2 -->|Count Rooms by Type| DS_Rooms
    P7_2 -->|Count Friendships| DS_Friendships
    DS_Users -->|User Stats| P7_2
    DS_Messages -->|Message Stats| P7_2
    DS_Rooms -->|Room Stats| P7_2
    DS_Friendships -->|Friendship Stats| P7_2
    P7_2 -->|Dashboard Data| Admin

    %% === 7.3 USER MANAGEMENT ===
    Admin -->|Ban/Suspend/Warn, Reason| P7_3
    P7_3 -->|Update User Status| DS_Users
    P7_3 -->|Action Completed| Admin

    %% === 7.4 REPORT REVIEW ===
    Admin -->|Review Report, Report ID| P7_4
    P7_4 -->|Fetch Report Details| DS_Users
    P7_4 -->|Get Reported User Info| DS_Users
    P7_4 -->|Update Report Status| DS_Users
    P7_4 -->|Apply Moderation if needed| P7_3
    P7_4 -->|Report Resolved| Admin

    %% === 7.5 PASSKEY MANAGEMENT ===
    Admin -->|List/Register/Delete| P7_5
    P7_5 -->|Fetch All Passkeys| DS_Passkeys
    DS_Passkeys -->|Passkey List| P7_5
    P7_5 -->|Create/Delete Passkey| DS_Passkeys
    P7_5 -->|Passkey List| Admin

    %% === 7.6 DEBUG USER DATA ===
    Admin -->|User ID/Email| P7_6
    P7_6 -->|Fetch Complete User Data| DS_Users
    DS_Users -->|Full User Object| P7_6
    P7_6 -->|Debug Data| Admin

    style P7_1 fill:#fd79a8,stroke:#e84393,stroke-width:2px,color:#fff
    style P7_2 fill:#fe8bb3,stroke:#e84393,stroke-width:2px,color:#fff
    style P7_3 fill:#ff9dbe,stroke:#e84393,stroke-width:2px,color:#fff
    style P7_4 fill:#ffafc9,stroke:#e84393,stroke-width:2px,color:#000
    style P7_5 fill:#ffc1d4,stroke:#e84393,stroke-width:2px,color:#000
    style P7_6 fill:#ffd3df,stroke:#e84393,stroke-width:2px,color:#000
```

---

## 📝 Penjelasan DFD

### Level 0 - Context Diagram

- **Fungsi**: Menampilkan sistem sebagai satu kesatuan dengan 4 entitas eksternal
- **Entitas Eksternal**:
  - **User**: Pengguna aplikasi (chat, friend management)
  - **Admin**: Administrator sistem (management, moderation)
  - **Email System**: SMTP untuk verifikasi email dan reset password
  - **AI System**: Gemini LLM untuk AI chat assistant

### Level 1 - Major Processes

Sistem dipecah menjadi 7 proses utama:

1. **Authentication & Authorization** - Login, register, passkey, verification
2. **User Profile Management** - Profile, avatar, banner, password
3. **Friendship Management** - Add friend, accept, reject, block
4. **Room Management** - Create rooms (private/group/AI)
5. **Message Management** - Send, edit, delete messages, read receipts
6. **AI Chat Integration** - AI processing dan response generation
7. **Admin Management** - Dashboard, user management, reports

### Level 2 - Detailed Sub-Processes

Setiap proses Level 1 dipecah menjadi sub-proses detail dengan alur data lengkap:

- **2.1**: Authentication detail (6 sub-process)
- **2.2**: User Profile detail (6 sub-process)
- **2.3**: Friendship detail (6 sub-process)
- **2.4**: Room Management detail (8 sub-process)
- **2.5**: Message Management detail (7 sub-process)
- **2.6**: AI Integration detail (5 sub-process)
- **2.7**: Admin Management detail (6 sub-process)

### Data Stores (MongoDB Collections)

1. **Users** - User accounts, profiles, authentication
2. **Passkeys** - WebAuthn credentials
3. **Friendships** - Friend relationships
4. **Rooms** - Chat rooms (private, group, AI)
5. **Messages** - Chat messages with attachments

---

## 🎯 Kesesuaian dengan Codebase

DFD ini dibuat berdasarkan analisis **100% sesuai** dengan codebase:

✅ **Database Schema**: `database-schema.dbml`
✅ **API Endpoints**: `docs/API_REFERENCE.md`
✅ **ERD**: `docs/ERD_MERMAID.md`
✅ **Use Case**: `docs/USECASE_DIAGRAM.md`
✅ **Activity Diagram**: `docs/ACTIVITY_DIAGRAM.md`
✅ **Authentication**: NextAuth 5.0 with Passkey support
✅ **Real-time**: Socket.io for live messaging
✅ **AI Integration**: Gemini API integration
✅ **Admin System**: Passkey-based admin authentication

---

## 📦 Export untuk Draw.io

Diagram Mermaid di atas dapat diimport ke Draw.io dengan cara:

1. Copy kode Mermaid (dalam blok ```mermaid)
2. Buka Draw.io → **Arrange** → **Insert** → **Advanced** → **Mermaid**
3. Paste kode Mermaid
4. Klik **Insert**

Atau gunakan plugin Mermaid di Draw.io untuk edit langsung.

---

**Dibuat pada**: 2026-02-01  
**Versi**: 1.0  
**Status**: ✅ Complete & Verified
