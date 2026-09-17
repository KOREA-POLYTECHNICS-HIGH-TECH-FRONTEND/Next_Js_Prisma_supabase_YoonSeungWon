-- ============================================================================
-- Supabase Board 스키마를 한 번에 만드는 SQL
-- ============================================================================
--
-- 사용법
--   1. Supabase 대시보드의 'SQL Editor' 페이지를 엽니다.
--   2. 이 파일의 내용을 통째로 붙여 넣고 'Run'을 누릅니다.
--   3. 테이블 구조를 바꾸는 문장이 있어서 확인 창이 뜨면 'Run query'를 누릅니다.
--   4. 결과 창에 테이블 4개와 열 개수가 표로 나오면 성공입니다.
--
-- 처음 만드는 프로젝트뿐 아니라, 대시보드에서 손으로 일부 테이블을 만들어 둔
-- 프로젝트에서도 그대로 실행할 수 있습니다. 모든 문장이 "없으면 만들고 있으면
-- 건너뛰는" 형태라 여러 번 실행해도 안전합니다.
--
-- 이 파일이 만드는 것
--   타입      user_role (user, admin)
--   테이블    profiles, posts, post_images, comments
--   인덱스    정책과 관계 조회에 쓰는 열
--   함수      handle_new_user (가입 시 프로필 자동 생성), increment_view_count
--   트리거    on_auth_user_created (auth.users에 행이 생기면 profiles에도 생성)
--   스토리지  post-images 버킷 (비공개, 5MB, 이미지만)
--   잠금      RLS 정책 전부 제거 + anon, authenticated 권한 회수 (prisma8 브랜치 기준)
--
-- 이 파일이 만들지 않는 것
--   Google 로그인 설정          'Authentication > Sign In / Providers' 에서 직접
--   Redirect URL 등록           'Authentication > URL Configuration' 에서 직접
--   prisma_contract.marker      `npm run db:sign` 이 만듭니다
--
-- 완성된 테이블 구조
--
--   profiles                  사용자 프로필. id 는 auth.users.id 와 같음
--     id          uuid         PK, auth.users(id) 참조, 사용자 삭제 시 함께 삭제
--     created_at  timestamptz  기본값 now()
--     username    text         Google 계정 이름 또는 이메일 앞부분
--     avatar_url  text?        Google 프로필 사진 주소 또는 스토리지 경로
--     role        user_role    기본값 'user'. 관리자는 SQL로 직접 부여
--
--   posts                     글
--     id          bigint       PK, 자동 증가
--     created_at  timestamptz  기본값 now()
--     content     text
--     user_id     uuid         profiles(id) 참조, 기본값 auth.uid()
--     image_path  text?        main 브랜치가 쓰던 열. prisma8 브랜치는 비워 둠
--     view_count  integer      기본값 0
--
--   post_images               글 하나에 사진 여러 장
--     id          bigint       PK, 자동 증가
--     created_at  timestamptz  기본값 now()
--     post_id     bigint       posts(id) 참조, 글 삭제 시 함께 삭제
--     path        text         스토리지 경로, 유일
--     sort_order  integer      화면에 보일 순서, 기본값 0
--
--   comments                  댓글
--     id          bigint       PK, 자동 증가
--     created_at  timestamptz  기본값 now()
--     content     text
--     post_id     bigint       posts(id) 참조, 글 삭제 시 함께 삭제
--     user_id     uuid         profiles(id) 참조, 기본값 auth.uid()


-- ============================================================================
-- 1. 타입
-- ============================================================================

-- 관리자 역할. 새 사용자는 모두 user 이고, 관리자는 파일 맨 아래의 update 문으로 부여합니다.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role' and typnamespace = 'public'::regnamespace) then
    create type public.user_role as enum ('user', 'admin');
  end if;
end
$$;


-- ============================================================================
-- 2. 테이블
-- ============================================================================

-- 프로필. auth.users 는 인증 시스템의 영역이라 직접 고치지 않고, 서비스에 필요한 값만 여기에 둡니다.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  username    text not null,
  avatar_url  text,
  role        public.user_role not null default 'user'
);

-- 글. user_id 의 기본값 auth.uid() 는 Supabase 클라이언트로 요청할 때만 채워집니다.
-- Prisma 는 postgres 역할로 연결해 auth.uid() 가 null 이므로 코드에서 반드시 넘깁니다.
create table if not exists public.posts (
  id          bigint primary key generated always as identity,
  created_at  timestamptz not null default now(),
  content     text not null,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  image_path  text,
  view_count  integer not null default 0
);

-- 글 하나에 사진 여러 장. 글이 지워지면 외래 키의 on delete cascade 로 함께 사라집니다.
-- 스토리지의 파일까지 지우지는 못하므로 서버 액션이 지우기 전에 경로를 읽어 둡니다.
create table if not exists public.post_images (
  id          bigint primary key generated always as identity,
  created_at  timestamptz not null default now(),
  post_id     bigint not null references public.posts (id) on delete cascade,
  path        text not null,
  sort_order  integer not null default 0
);

-- 댓글
create table if not exists public.comments (
  id          bigint primary key generated always as identity,
  created_at  timestamptz not null default now(),
  content     text not null,
  post_id     bigint not null references public.posts (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade
);

-- 글(Supabase 핵심 정리)을 따라가며 테이블을 먼저 만들어 둔 프로젝트를 위한 보정입니다.
-- 글에서는 열을 나중에 하나씩 추가하므로, 빠진 열이 있으면 여기서 채웁니다.
-- 위에서 테이블을 새로 만든 경우에는 모두 이미 있어서 아무 일도 하지 않습니다.
--
-- 주의: 글의 확인용 데이터처럼 작성자 없는 글이 남아 있으면 user_id 열을 not null 로 추가할 수 없습니다.
-- 그런 프로젝트는 먼저 `delete from public.posts;` 를 실행한 뒤 이 파일을 실행합니다.
alter table public.profiles add column if not exists role public.user_role not null default 'user';
alter table public.posts    add column if not exists user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade;
alter table public.posts    add column if not exists image_path text;
alter table public.posts    add column if not exists view_count integer not null default 0;
alter table public.comments add column if not exists user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade;

-- 행 수준 보안은 네 테이블 모두 켭니다.
-- 프로젝트를 만들 때 'Enable automatic RLS' 를 켰다면 이미 켜져 있지만, 어떤 프로젝트에서도 같은 결과가 나오도록 항상 적습니다.
alter table public.profiles    enable row level security;
alter table public.posts       enable row level security;
alter table public.post_images enable row level security;
alter table public.comments    enable row level security;


-- ============================================================================
-- 3. 인덱스
-- ============================================================================

-- 외래 키 열과 정책 조건에 쓰는 열입니다. 이름은 prisma/contract.prisma 의 @@index(map: ...) 과 같아야 합니다.
create index        if not exists posts_user_id_idx       on public.posts (user_id);
create index        if not exists comments_post_id_idx    on public.comments (post_id);
create index        if not exists comments_user_id_idx    on public.comments (user_id);
create index        if not exists post_images_post_id_idx on public.post_images (post_id);
create unique index if not exists post_images_path_key    on public.post_images (path);


-- ============================================================================
-- 4. 함수와 트리거
-- ============================================================================

-- 가입할 때 프로필 행을 자동으로 만듭니다.
-- Google 로그인으로 가입한 사용자는 raw_user_meta_data 에 이름(full_name)과 사진(avatar_url)이 담겨 있어 그대로 가져옵니다.
--
-- security definer: 가입 처리는 supabase_auth_admin 역할로 실행되는데 이 역할은 public 테이블에 권한이 없습니다.
--                   함수를 만든 postgres 역할의 권한으로 실행되게 해서 프로필 행을 넣을 수 있게 합니다.
-- set search_path = '': 함수 안에서 테이블 이름을 항상 public.profiles 처럼 전체 경로로 쓰게 강제합니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- 트리거는 create if not exists 가 없어서 지우고 다시 만듭니다.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 이 SQL 을 실행하기 전에 이미 로그인한 사용자의 프로필을 한 번만 채웁니다.
-- 트리거는 앞으로 가입하는 사용자에게만 적용되기 때문입니다.
insert into public.profiles (id, username, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 조회수를 1 늘리는 함수. 애플리케이션에서 읽고 더해 저장하면 동시 요청에서 값이 어긋나므로 한 문장으로 처리합니다.
-- prisma8 브랜치는 이 함수를 부르지 않지만, main 브랜치와 글의 예제가 쓰므로 함께 만들어 둡니다.
create or replace function public.increment_view_count(target_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.posts set view_count = view_count + 1 where id = target_id;
$$;


-- ============================================================================
-- 5. 스토리지 버킷
-- ============================================================================

-- 글 사진과 프로필 사진을 담는 버킷입니다. 경로는 {userId}/posts/{uuid}, {userId}/avatar/{uuid} 로 나뉩니다.
-- prisma8 브랜치는 비공개 버킷을 쓰고 서버가 서명된 주소를 발급합니다. 이미 있으면 설정만 맞춥니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', false, 5242880, array['image/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================================
-- 6. 잠그기 (prisma8 브랜치 기준)
-- ============================================================================
--
-- 이 브랜치는 모든 데이터 접근이 서버(Prisma)를 거치므로,
-- 브라우저에 노출되는 Publishable 키로 데이터에 닿을 수 있는 경로를 아예 없앱니다.
-- Prisma 는 postgres 역할로 연결하고 이 역할에는 bypassrls 가 붙어 있어서 아래 내용의 영향을 받지 않습니다.
--
-- main 브랜치(Supabase 클라이언트 방식)로 수업한다면 이 절을 실행하지 말고, 맨 아래 7절의 정책을 대신 실행합니다.

-- 정책이 하나도 없으면 RLS 가 켜진 테이블은 전부 거부됩니다.
drop policy if exists "임시 전체 허용"     on public.posts;
drop policy if exists "임시 전체 허용"     on public.comments;
drop policy if exists "글 조회는 모두 허용"   on public.posts;
drop policy if exists "글 작성은 본인만"     on public.posts;
drop policy if exists "글 수정은 작성자만"   on public.posts;
drop policy if exists "글 삭제는 작성자만"   on public.posts;
drop policy if exists "댓글 조회는 모두 허용" on public.comments;
drop policy if exists "댓글 작성은 본인만"   on public.comments;
drop policy if exists "댓글 수정은 작성자만" on public.comments;
drop policy if exists "댓글 삭제는 작성자만" on public.comments;
drop policy if exists "프로필 조회는 모두 허용" on public.profiles;
drop policy if exists "프로필 수정은 본인만"   on public.profiles;

-- 테이블 권한 자체를 회수합니다. 정책을 실수로 다시 만들어도 권한이 없으면 뚫리지 않습니다.
-- 앞으로 public 스키마에 새로 만드는 테이블도 같은 상태로 시작합니다.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- 스토리지도 같은 방식으로 잠급니다. 업로드와 삭제는 서버가 Secret 키로 처리합니다.
drop policy if exists "이미지 조회는 모두 허용"       on storage.objects;
drop policy if exists "이미지 업로드는 본인 폴더에만" on storage.objects;
drop policy if exists "이미지 수정은 본인 폴더에만"   on storage.objects;
drop policy if exists "이미지 삭제는 본인 폴더에만"   on storage.objects;


-- ============================================================================
-- 확인
-- ============================================================================

-- SQL Editor 는 마지막 문장의 결과만 보여 줍니다. 테이블 4개와 열 개수가 나오면 성공입니다.
--   comments 5, post_images 5, posts 6, profiles 5
select table_name, count(*) as columns
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'posts', 'post_images', 'comments')
group by table_name
order by table_name;


-- ============================================================================
-- 이후에 따로 실행하는 것
-- ============================================================================
--
-- 관리자 부여. 사용자 UUID 는 'Authentication > Users' 페이지나 아래 조회로 확인합니다.
--
--   select id, username, role from public.profiles;
--   update public.profiles set role = 'admin' where id = '사용자UUID';
--   update public.profiles set role = 'user'  where id = '사용자UUID';   -- 회수


-- ============================================================================
-- 7. main 브랜치용 정책 (Supabase 클라이언트 방식, 선택)
-- ============================================================================
--
-- 데이터를 Prisma 가 아니라 supabase-js 로 다루는 main 브랜치에서는
-- 6절의 잠금 대신 아래 정책이 필요합니다. 주석을 풀고 이 절만 따로 실행합니다.
-- 6절을 이미 실행했다면 첫 두 줄의 grant 로 권한을 먼저 돌려줘야 합니다.
--
-- grant all on all tables in schema public to anon, authenticated;
-- alter default privileges in schema public grant all on tables to anon, authenticated;
--
-- create policy "글 조회는 모두 허용" on public.posts for select using (true);
-- create policy "글 작성은 본인만" on public.posts for insert to authenticated
--   with check ((select auth.uid()) = user_id);
-- create policy "글 수정은 작성자만" on public.posts for update to authenticated
--   using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- create policy "글 삭제는 작성자만" on public.posts for delete to authenticated
--   using ((select auth.uid()) = user_id);
--
-- create policy "댓글 조회는 모두 허용" on public.comments for select using (true);
-- create policy "댓글 작성은 본인만" on public.comments for insert to authenticated
--   with check ((select auth.uid()) = user_id);
-- create policy "댓글 수정은 작성자만" on public.comments for update to authenticated
--   using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- create policy "댓글 삭제는 작성자만" on public.comments for delete to authenticated
--   using ((select auth.uid()) = user_id);
--
-- create policy "프로필 조회는 모두 허용" on public.profiles for select using (true);
-- create policy "프로필 수정은 본인만" on public.profiles for update to authenticated
--   using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
--
-- create policy "이미지 조회는 모두 허용" on storage.objects for select
--   using (bucket_id = 'post-images');
-- create policy "이미지 업로드는 본인 폴더에만" on storage.objects for insert to authenticated
--   with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- create policy "이미지 수정은 본인 폴더에만" on storage.objects for update to authenticated
--   using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- create policy "이미지 삭제는 본인 폴더에만" on storage.objects for delete to authenticated
--   using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
--
-- update storage.buckets set public = true where id = 'post-images';
--
-- main 브랜치는 브라우저가 comments 테이블의 변경을 직접 구독(postgres_changes)하므로
-- 'Database > Publications' 에서 supabase_realtime 의 comments 를 켜거나 아래를 실행합니다.
-- prisma8 브랜치는 Broadcast 를 쓰므로 필요 없습니다.
--
-- alter publication supabase_realtime add table public.comments;
