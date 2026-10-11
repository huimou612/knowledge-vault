-- ============================================================
-- 知识仓库 Knowledge Vault · Supabase 数据库结构
-- 使用方法：在 Supabase 项目控制台 → SQL Editor 中执行本文件
-- ============================================================

-- 任务表
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default '其他',
  priority text default 'medium' check (priority in ('high','medium','low')),
  date date not null,
  done boolean default false,
  done_at timestamptz,
  created_at timestamptz default now()
);

-- 每日打卡表
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  note text,
  created_at timestamptz default now()
);

-- 学习记录表
create table if not exists study_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  subject text not null default '其他',
  minutes int not null default 0,
  note text,
  created_at timestamptz default now()
);

-- 单词本
create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  phonetic text,
  meaning text not null,
  example text,
  mastered boolean default false,
  created_at timestamptz default now()
);

-- 学习计划
create table if not exists study_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text default '其他',
  target text,
  deadline date,
  progress int default 0 check (progress between 0 and 100),
  created_at timestamptz default now()
);

-- 自媒体作品
create table if not exists media_works (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('xiaohongshu','douyin','gongzhonghao')),
  title text not null,
  status text not null default 'idea' check (status in ('idea','drafting','ready','published')),
  publish_date date,
  views int default 0,
  likes int default 0,
  comments int default 0,
  collects int default 0,
  review text,
  created_at timestamptz default now()
);

-- 闲鱼商品
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cost numeric(10,2) default 0,
  price numeric(10,2) default 0,
  stock int default 1,
  status text default 'on-sale' check (status in ('on-sale','sold','off-shelf')),
  created_at timestamptz default now()
);

-- 闲鱼订单
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  title text not null,
  price numeric(10,2) not null,
  cost numeric(10,2) default 0,
  quantity int default 1,
  date date not null,
  status text default 'completed' check (status in ('completed','refunded')),
  created_at timestamptz default now()
);

-- 知识库笔记
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text default '',
  category text default '未分类',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 常用统计视图
create or replace view v_order_profit as
select
  date_trunc('month', date) as month,
  count(*) as order_count,
  sum(price * quantity) as income,
  sum((price - cost) * quantity) as profit
from orders
where status = 'completed'
group by 1
order by 1 desc;

-- 单用户使用：为简化可关闭 RLS；如开启 RLS 请配置对应策略
alter table tasks disable row level security;
alter table checkins disable row level security;
alter table study_logs disable row level security;
alter table words disable row level security;
alter table study_plans disable row level security;
alter table media_works disable row level security;
alter table products disable row level security;
alter table orders disable row level security;
alter table notes disable row level security;

-- 索引
create index if not exists idx_tasks_date on tasks(date);
create index if not exists idx_study_logs_date on study_logs(date);
create index if not exists idx_orders_date on orders(date);
create index if not exists idx_notes_category on notes(category);
