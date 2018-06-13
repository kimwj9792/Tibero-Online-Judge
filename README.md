* # Tibero Online Judge

  티베로 온라인 알고리즘 채점 시스템

  ## Tiboro Online Judge가 무엇인가요?

  개설 강의 목록과 강의평을 기반으로 조건에 맞는 최적의 시간표를 자동으로 구성해 주는 서비스입니다.
  경희대학교 컴퓨터공학과 2018년 1학기 데이터베이스 수업의 일환으로 개발되었습니다.

  ## 사용방법

  #### 요구사항

  - Node.js 8.11.2 LTS Version
  - Tibero 또는 odbc를 지원하는 DBMS

  #### 데이터베이스 초기설정

  ```sql
  --create usrs
  create table Usrs
  (
  UserID VARCHAR(15),
  Name VARCHAR(20),
  Email VARCHAR(30),
  Password VARCHAR(20),
  PassProblemCount NUMBER,
  SubmitProblemCount NUMBER,
  primary key(UserID)
  );
  
  --usrs sequence
  create sequence usrs_userid_seq
  increment by 1
  start with 1
  maxvalue 99999
  nocycle
  nocache;
  
  --create problems
  create table Problems
  (
  ProblemID NUMBER,
  ProblemName VARCHAR(20),
  ProblemExplain VARCHAR(2000),
  SampleInputText VARCHAR(1000),
  SampleOutputText VARCHAR(1000),
  TestcaseInputText VARCHAR(1000),
  TestcaseOutputText VARCHAR(1000),
  TimeLimit NUMBER,
  MemoryLimit NUMBER,
  primary key(ProblemID)
  );
  
  --Problems sequence
  create sequence Problems_ProblemID_seq
  increment by 1
  start with 1
  maxvalue 99999
  nocycle
  nocache;
  
  --create contest
  create table Contest
  (
  ContestID NUMBER,
  CreaterID VARCHAR(15) NOT NULL,
  Title VARCHAR(20),
  StartTime timestamp,
  EndTime Timestamp,
  primary key(ContestID),
  foreign key(CreaterID) references Usrs(UserID)
  );
  
  --contest sequence
  create sequence contest_contestid_seq
  increment by 1
  start with 1
  maxvalue 99999
  nocycle
  nocache;
  
  --create submit
  create table Submit
  (
  SubmitID NUMBER ,
  SubmitUserID VARCHAR(15) NOT NULL,
  SubmitProblemID NUMBER NOT NULL,
  LanguageID NUMBER,
  SourceCode VARCHAR(5000),
  Result VARCHAR(20),
  CpuTime NUMBER,
  Memory NUMBER,
  SubmitTime TIMESTAMP
  CONSTRAINT "Submit_ID_PK" PRIMARY KEY(SubmitID),
  foreign key(SubmitUserID) references usrs(UserID),
  foreign key(SubmitProblemID) references Problems(ProblemID)
  );
  
  --submit sequence
  create sequence submit_submitid_seq
  increment by 1
  start with 1
  maxvalue 99999
  nocycle
  nocache;
  
  --create contestJoiners
  create table ContestJoiners
  (
  ContestID NUMBER,
  ContestJoinerID VARCHAR(15),
  Score NUMBER,
  foreign key(ContestID) references Contest(ContestID),
  foreign key(ContestJoinerID) references Usrs(UserID)
  );
  
  --create ContestProblems
  create table ContestProblems
  (
  ContestID NUMBER ,
  ProblemID NUMBER,
  foreign key(ContestID) references Contest(ContestID),
  foreign key(ProblemID) references Problems(ProblemID)
  );
  ```

  #### 서버 설정

  ###### Node.js

  Node.js의 경우 odbc 모듈을 사용하기 위하여 node-gyp를 먼저 설치하여야 합니다.

  아래의 명령어를 입력하여 node-gyp의 설치를 먼저 완료하세요.

  ```
  npm install --global --production windows-build-tools
  npm install --global node-gyp
  ```

  그 후 프로젝트에 설치된 모듈을 일괄 설치 해주세요. (모든 모듈은 package.json 안에 존재합니다.)

  ```
  npm install
  ```

  #### 데이터베이스 연결

  ###### DB Connection

  routes 폴더에 index.js 를 사용하시는 DBMS의 연결정보로 수정해 주세요.

  ```
  DRIVER={Tibero 6 ODBC Driver};SERVER=localhost;PORT=8629;DB=tibero;UID=HR;PWD=tibero
  ```

  ###### 

  ## 라이센스

  본 서비스에 사용된 오픈소스의 라이센스는 아래와 같습니다.

  - Bootstrap 3.3.7 (MIT)
  - Font-Awesome 4.7.0 (SIL OFL 1.1/MIT)
  - jQuery 1.9.1 (MIT)
  - HTML5 Shiv 3.7.3 (MIT/GPL2)
  - Node.js 8.11.2 LTS (MIT)

  ## 문의

  필요에 따라 자유롭게 수정, 사용, 배포하셔도 됩니다.
  문의사항은 이메일(kuj0902@gmail.com)로 보내주시기 바랍니다.