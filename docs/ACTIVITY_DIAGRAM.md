# Activity Diagram

This document contains the Activity Diagram for the Chit-Chat-V5AI application, reflecting the actual code implementation.

## System Overview

The system consists of 4 main components:

1.  **User**: The end-user interacting with the UI.
2.  **Client (Next.js)**: The frontend application running in the browser.
3.  **Server (Next.js API & PartyKit)**: The backend handling logic, database, and real-time events.
4.  **Database (MongoDB)**: The persistent storage.

## Main Activity Flows

```mermaid
flowchart TD
    %% Define Styles
    classDef actor fill:#f9f,stroke:#333,stroke-width:2px
    classDef client fill:#bbf,stroke:#333,stroke-width:2px
    classDef server fill:#dfd,stroke:#333,stroke-width:2px
    classDef db fill:#ff9,stroke:#333,stroke-width:2px

    Start((Start)) --> UserDecision{User Action?}

    %% AUTHENTICATION FLOW
    subgraph Auth_Flow [Authentication]
        direction TB
        LoginCase(Login)
        RegisterCase(Register)

        LoginCase -->|Input Credentials| LoginAPI[API: POST /auth/signin]
        LoginAPI -->|Validate| ValidateCreds{Valid?}
        ValidateCreds -->|No| LoginError[Return Error]
        ValidateCreds -->|Yes| CheckBan{Banned?}
        CheckBan -->|Yes| LoginError
        CheckBan -->|No| GenSession[Generate Session JWT]
        GenSession --> LoginSuccess[Return User Data]

        RegisterCase -->|Input Data| RegisterAPI[API: POST /api/register]
        RegisterAPI -->|Check Exists| CheckUser{User Exists?}
        CheckUser -->|Yes| RegisterError[Return Error]
        CheckUser -->|No| GenToken[Generate OTP & Token]
        GenToken --> HashPwd[Hash Password]
        HashPwd --> CreateUser[DB: Insert User]
        CreateUser --> SendEmail{Send Email?}

        SendEmail -->|Success| RegisterSuccess[Return Success]
        SendEmail -->|Fail| DelUser[DB: Delete User]
        DelUser --> RegisterFailed[Return Error]
    end

    %% MESSAGING FLOW
    subgraph Messaging_Flow [Messaging]
        direction TB
        SendMsg(Send Message)

        SendMsg -->|Type & Send| MsgAPI[API: POST /api/messages]
        MsgAPI -->|Validate| CheckRoom{Valid Room?}
        CheckRoom -->|No| MsgError[Return Error]
        CheckRoom -->|Yes| SaveMsg[DB: Insert Message]
        SaveMsg --> UpdateRoom[DB: Update LastActivity]
        UpdateRoom --> CheckAI{Starts with /ai?}

        CheckAI -->|No| ReturnMsg[Return MessageId]
        CheckAI -->|Yes| ReturnMsg
        CheckAI -->|Yes| bgAI[Background: Process AI]

        ReturnMsg --> SocketEmit[Client: PartySocket Emit]
        SocketEmit --> PartyServer[PartyKit: onMessage]
        PartyServer --> Broadcast[Broadcast to Room]
        Broadcast --> ReceiveMsg(User Receives Message)

        bgAI --> FetchContext[DB: Get Recent Msgs]
        FetchContext --> CallLLM[External: Call AI Model]
        CallLLM --> SaveAI[DB: Insert AI Message]
        SaveAI --> AI_End[End Background Process]
    end

    %% FRIENDSHIP FLOW
    subgraph Friend_Flow [Friendship]
        direction TB
        AddFriend(Add Friend)

        AddFriend -->|Request| FriendAPI[API: POST /api/friends/add]
        FriendAPI -->|Check| CheckFriend{Exists/Pending?}
        CheckFriend -->|Yes| FriendError[Return Error]
        CheckFriend -->|No| CreateReq[DB: Create Friendship Doc]
        CreateReq --> FriendSuccess[Return Success]

        AcceptFriend(Accept Request)
        AcceptFriend -->|Action| AcceptAPI[API: POST /api/friends/respond]
        AcceptAPI --> UpdateFriend[DB: Update Status=accepted]
        UpdateFriend --> CreateRoom[DB: Create DM Room]
        CreateRoom --> AcceptSuccess[Return Success]
    end

    %% ROOM MANAGEMENT FLOW
    subgraph Room_Flow [Room Management]
        direction TB
        CreateRoomCase(Create Room)

        CreateRoomCase -->|Input Type/Members| RoomAPI[API: POST /api/rooms/create]
        RoomAPI -->|Check Type| CheckType{Type?}

        CheckType -->|Private| CheckFriendship{Are Friends?}
        CheckFriendship -->|No| RoomError[Return Error]
        CheckFriendship -->|Yes| CheckExistingPriv{Exists?}
        CheckExistingPriv -->|Yes| RoomError
        CheckExistingPriv -->|No| CreatePriv[DB: Create Private Room]
        CreatePriv --> RoomSuccess[Return Success]

        CheckType -->|Group| CheckGroupData{Valid Data?}
        CheckGroupData -->|No| RoomError
        CheckGroupData -->|Yes| CreateGroup[DB: Create Group Room]
        CreateGroup --> RoomSuccess

        CheckType -->|AI| CheckExistingAI{Exists?}
        CheckExistingAI -->|Yes| RoomError
        CheckExistingAI -->|No| CreateAI[DB: Create AI Room]
        CreateAI --> RoomSuccess
    end

    %% MAIN CONNECTIONS
    UserDecision -->|Login| LoginCase
    UserDecision -->|Register| RegisterCase
    UserDecision -->|Send Msg| SendMsg
    UserDecision -->|Add Friend| AddFriend
    UserDecision -->|Accept Friend| AcceptFriend
    UserDecision -->|Create Room| CreateRoomCase

    %% APPLY STYLES
    class UserDecision,LoginCase,RegisterCase,SendMsg,AddFriend,AcceptFriend,ReceiveMsg,CreateRoomCase actor
    class LoginError,LoginSuccess,RegisterError,RegisterSuccess,RegisterFailed,MsgError,ReturnMsg,FriendError,FriendSuccess,AcceptSuccess,RoomError,RoomSuccess client
    class LoginAPI,RegisterAPI,MsgAPI,FriendAPI,AcceptAPI,RoomAPI,HashPwd,CheckBan,ValidateCreds,CheckUser,CheckRoom,CheckAI,bgAI,CallLLM,PartyServer,Broadcast,GenToken,SendEmail,CheckType,CheckFriendship,CheckExistingPriv,CheckGroupData,CheckExistingAI server
    class GenSession,CreateUser,SaveMsg,UpdateRoom,FetchContext,SaveAI,CreateReq,UpdateFriend,CreateRoom,DelUser,CreatePriv,CreateGroup,CreateAI db
```

## Detailed Activity Sequences

### 1. Send Message Sequence

1.  **User** types message and clicks send.
2.  **Client** calls `POST /api/messages` with content and `roomId`.
3.  **API** validates user session and room membership.
4.  **API** generates `messageId` and saves to MongoDB.
5.  **API** updates `lastMessage` and `lastActivity` in `Room` collection.
6.  **API** returns success with `messageId` to **Client**.
7.  **Client** emits message via **PartyKit** websocket.
8.  **PartyKit Server** receives event and broadcasts to all connected clients in the room.
9.  **User** (Peer) receives update and UI refreshes.

### 2. AI Command Sequence (/ai)

1.  **User** sends message starting with `/ai`.
2.  **API** processes standard message saving (steps 1-6 above).
3.  **API** triggers background process:
    - Fetches recent chat history from DB.
    - Calls internal AI endpoint.
    - Saves AI response to MongoDB as a new message.
    - Updates Room's last message.

### 3. Login Sequence

1.  **User** submits credentials.
2.  **NextAuth** verifies `username`/`email` and `password` (bcrypt comparison).
3.  **NextAuth** checks `isBanned` and `suspendedUntil`.
4.  **NextAuth** creates JWT session if valid.

### 4. Register Sequence

1.  **User** submits registration form.
2.  **API** validates input and checks for duplicates.
3.  **API** generates verification token and OTP.
4.  **API** hashes password and creates user (status: unverified).
5.  **API** attempts to send verification email.
    - **Success**: Returns success message.
    - **Failure**: Deletes the newly created user and returns error.

### 5. Create Room Sequence

1.  **Client** sends request with `type` (private/group/ai), `name`, and `memberIds`.
2.  **API** validates request body based on room type.
3.  **API** checks constraints:
    - **Private**: Must be friends, no existing private room.
    - **AI**: No existing AI room.
    - **Group**: Valid name and members.
4.  **API** generates unique `roomId` and `slug`.
5.  **API** inserts new room document into `rooms` collection.
6.  **API** returns success with room details.
