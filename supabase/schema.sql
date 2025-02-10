-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS tool_categories CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table for user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create tools table for AI tools
CREATE TABLE tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  price_type TEXT NOT NULL CHECK (price_type IN ('free', 'paid', 'free_trial')),
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  website_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create tool_categories junction table
CREATE TABLE tool_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(tool_id, category_id)
);

-- Create reviews table for user reviews
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_id UUID REFERENCES tools ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create favorites table for user favorites
CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_id UUID REFERENCES tools ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(tool_id, user_id)
);

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tools policies
CREATE POLICY "Tools are viewable by everyone"
  ON tools FOR SELECT
  USING (TRUE);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (TRUE);

-- Tool categories policies
CREATE POLICY "Tool categories are viewable by everyone"
  ON tool_categories FOR SELECT
  USING (TRUE);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Favorites are viewable by everyone"
  ON favorites FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS
alter table tools enable row level security;
alter table categories enable row level security;
alter table tool_categories enable row level security;

-- Create policies
create policy "Enable read access for all users" on tools for select using (true);
create policy "Enable read access for all users" on categories for select using (true);
create policy "Enable read access for all users" on tool_categories for select using (true);

-- Create or replace functions for handling tool categories
create or replace function get_tool_categories(tool_row tools)
returns setof tool_categories
language sql
security definer
set search_path = public
stable
as $$
    select tc.*
    from tool_categories tc
    where tc.tool_id = tool_row.id;
$$;

-- Add function to get categories
create or replace function get_categories(tc_row tool_categories)
returns setof categories
language sql
security definer
set search_path = public
stable
as $$
    select c.*
    from categories c
    where c.id = tc_row.category_id;
$$;

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- Insert categories
INSERT INTO categories (name, description) VALUES
('문서 작성', 'AI를 활용한 문서 작성, 편집, 교정 도구'),
('데이터 분석', '데이터 시각화 및 분석을 위한 AI 도구'),
('이미지 생성', '이미지 생성 및 편집을 위한 AI 도구'),
('오디오 생성', '음성 및 오디오 생성, 편집을 위한 AI 도구'),
('비디오 생성', '비디오 생성 및 편집을 위한 AI 도구'),
('코딩', '코드 작성 및 개발을 돕는 AI 도구'),
('디자인', 'UI/UX 및 그래픽 디자인을 위한 AI 도구'),
('언어 및 번역', '언어 번역 및 학습을 위한 AI 도구'),
('음성 및 오디오', '음성 인식 및 변환을 위한 AI 도구'),
('생산성', '업무 효율성 향상을 위한 AI 도구'),
('콘텐츠 제작', '다양한 형태의 콘텐츠 제작을 위한 AI 도구'),
('소셜 미디어', '소셜 미디어 관리 및 콘텐츠 제작을 위한 AI 도구'),
('마케팅 자동화', '마케팅 업무 자동화를 위한 AI 도구'),
('리서치 및 검색', 'AI 기반 정보 검색 및 분석 도구');

-- 기존 데이터 삭제
TRUNCATE TABLE tool_categories CASCADE;
TRUNCATE TABLE tools CASCADE;

-- tools 테이블에 unique 제약 조건 추가
ALTER TABLE tools ADD CONSTRAINT tools_title_unique UNIQUE (title);

-- 도구 데이터 삽입
INSERT INTO tools (title, description, price_type, features, image_url, website_url) VALUES
('ChatGPT', '자연어 처리 기반의 강력한 텍스트 생성 AI입니다.', 'free_trial', 
  ARRAY['자연어 대화', '문서 작성', '질문 답변'],
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
  'https://chat.openai.com'),
('Grammarly', '전문적인 글쓰기를 위한 AI 기반 문법 및 문체 교정 도구입니다.', 'free_trial',
  ARRAY['문법 검사', '문체 개선', '맞춤법 교정'],
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Grammarly_logo.svg/1200px-Grammarly_logo.svg.png',
  'https://www.grammarly.com'),
('Copy.ai', '마케팅 콘텐츠 제작을 위한 AI 작문 도구입니다.', 'free',
  ARRAY['블로그 작성', '광고 문구', '소셜 미디어 콘텐츠'],
  'https://assets-global.website-files.com/628288c5cd3e8411b90a36a4/62828b9d28d77a5155db01d0_favicon-256.png',
  'https://www.copy.ai'),
('Tableau', '데이터 시각화 및 비즈니스 인텔리전스 플랫폼입니다.', 'paid',
  ARRAY['대시보드 생성', '데이터 시각화', '실시간 분석'],
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tableau_Logo.png/1200px-Tableau_Logo.png',
  'https://www.tableau.com'),
('Power BI', '마이크로소프트의 데이터 분석 및 시각화 도구입니다.', 'free_trial',
  ARRAY['데이터 모델링', '리포트 생성', '협업 기능'],
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/New_Power_BI_Logo.svg/1200px-New_Power_BI_Logo.svg.png',
  'https://powerbi.microsoft.com'),
('DataRobot', '자동화된 머신러닝 플랫폼으로 예측 모델을 구축합니다.', 'paid',
  ARRAY['자동 ML', '예측 분석', '모델 배포'],
  'https://www.datarobot.com/wp-content/uploads/2021/07/DataRobot_Logo_Teal_RGB-1.png',
  'https://www.datarobot.com'),
('DALL-E', 'OpenAI의 텍스트 기반 이미지 생성 AI입니다.', 'paid',
  ARRAY['텍스트 투 이미지', '이미지 편집', '스타일 변환'],
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
  'https://openai.com/dall-e-3'),
('Midjourney', '고품질 아트워크를 생성하는 AI 도구입니다.', 'paid',
  ARRAY['아트워크 생성', '스타일 커스텀', '고해상도 출력'],
  'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png',
  'https://www.midjourney.com'),
('Stable Diffusion', '오픈소스 기반의 이미지 생성 AI입니다.', 'free',
  ARRAY['로컬 설치', '커스텀 모델', '배치 처리'],
  'https://upload.wikimedia.org/wikipedia/commons/2/28/Stability_AI_Logo.png',
  'https://stability.ai'),
('Murf AI', '전문적인 AI 음성 생성 및 더빙 플랫폼입니다.', 'free_trial',
  ARRAY['다국어 지원', '감정 표현', '실시간 변환'],
  'https://assets-global.website-files.com/62a1d5fd0cc3785e6a39dfcd/62a1d5fd0cc378fd1139e108_logo.svg',
  'https://murf.ai'),
('Descript', '오디오 및 비디오 편집을 위한 올인원 플랫폼입니다.', 'free_trial',
  ARRAY['음성 복제', '텍스트 기반 편집', '노이즈 제거'],
  'https://assets-global.website-files.com/5d761d627a6dfa6a5b28ab12/5e46171c82e2f32e33dd1d27_descript-favicon-2020.png',
  'https://www.descript.com'),
('LOVO AI', '자연스러운 AI 음성을 생성하는 도구입니다.', 'paid',
  ARRAY['음성 합성', '감정 제어', '실시간 변환'],
  'https://www.lovo.ai/images/lovo-logo.svg',
  'https://www.lovo.ai'),
('Cutback', '전문적인 비디오 편집을 위한 AI 기반 자동화 도구입니다.', 'paid',
  ARRAY['자동 하이라이트 생성', '음악 싱크', '스포츠 영상 특화'],
  'https://cutback.video/wp-content/uploads/2023/12/cutback-logo-1.svg',
  'https://cutback.video/ko/'),
('Filmora AI', 'Wondershare의 AI 기반 비디오 편집 소프트웨어입니다.', 'paid',
  ARRAY['AI 자막 생성', '배경 제거', '스마트 컷팅'],
  'https://images.wondershare.com/filmora/brand/filmora-logo-color.svg',
  'https://filmora.wondershare.net/kr/ad/filmora-brand.html'),
('Sora', 'OpenAI가 개발한 혁신적인 텍스트-투-비디오 생성 AI입니다.', 'paid',
  ARRAY['텍스트 기반 비디오 생성', '자연스러운 움직임', '복잡한 장면 생성'],
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/OpenAI_Logo.svg/1024px-OpenAI_Logo.svg.png',
  'https://openai.com/sora'),
('Suno', 'AI를 활용한 음악 창작 플랫폼입니다.', 'free_trial',
  ARRAY['AI 작곡', '보컬 생성', '다중 악기 지원'],
  'https://assets-global.website-files.com/6502af467b2a8c4ee8159a5b/6502b22993b683b1a9f51db9_favicon.png',
  'https://suno.com/home'),
('GitHub Copilot', 'AI 기반 코드 자동 완성 및 제안 도구입니다.', 'paid',
  ARRAY['코드 제안', '문서화', '버그 감지'],
  'https://github.githubassets.com/images/modules/site/copilot/copilot.png',
  'https://github.com/features/copilot'),
('Amazon CodeWhisperer', '아마존의 AI 코딩 어시스턴트입니다.', 'free_trial',
  ARRAY['코드 생성', '보안 검사', 'AWS 통합'],
  'https://d2908q01vomqb2.cloudfront.net/7719a1c782a1ba91c031a682a0a2f8658209adbf/2023/03/10/codewhisperer.png',
  'https://aws.amazon.com/codewhisperer'),
('Tabnine', '딥러닝 기반의 코드 자동 완성 도구입니다.', 'free',
  ARRAY['다중 언어 지원', '커스텀 트레이닝', '팀 협업'],
  'https://www.tabnine.com/favicon.ico',
  'https://www.tabnine.com'),
('Canva AI', 'AI 기능이 통합된 그래픽 디자인 플랫폼입니다.', 'free_trial',
  ARRAY['템플릿 제공', '이미지 생성', '자동 리사이즈'],
  'https://static.canva.com/web/images/12487a1e0770d29351bd4ce4f87ec8fe.svg',
  'https://www.canva.com'),
('Galileo AI', 'AI 기반 UI/UX 디자인 도구입니다.', 'paid',
  ARRAY['UI 생성', '프로토타입', '컴포넌트 추출'],
  'https://framerusercontent.com/images/nXLdc1LsU15dk6AODEpMgByLD0.png',
  'https://www.galileo.ai'),
('Looka', '로고 및 브랜드 디자인을 위한 AI 플랫폼입니다.', 'free_trial',
  ARRAY['로고 디자인', '브랜드 키트', '소셜 미디어 키트'],
  'https://looka.com/wp-content/themes/looka/images/logos/looka_logo_black.svg',
  'https://looka.com'),
('Creatie.ai', 'AI 기반 제품 디자인 소프트웨어로 디자이너의 작업 과정을 효율적으로 만들어줍니다. 고품질 목업 생성, 자동 스타일 가이드 생성, 아이콘 제작, 이미지 개선 등 다양한 기능을 제공합니다. 팀 협업에 최적화되어 있으며, 프로토타이핑과 디자인 핸드오프를 지원합니다.', 'free',
  ARRAY['AI 목업 생성', '스타일 가이드 자동화', '아이콘 생성', '이미지 개선', '팀 협업'],
  'https://creatie.ai/logo.png',
  'https://www.creatie.ai'),
('DeepL', '정확하고 자연스러운 번역을 제공하는 AI 기반 번역 서비스입니다. 다양한 언어 간의 고품질 번역을 지원하며, 전문적인 문서 번역에도 적합합니다.', 'free',
  ARRAY['자연스러운 번역', '다국어 지원', '문서 번역', '실시간 번역'],
  'https://static.deepl.com/img/logo/deepl-logo-blue.svg',
  'https://www.deepl.com'),
('다글로', '음성을 텍스트로 변환해주는 AI 서비스로, 회의록 작성과 음성 콘텐츠 제작에 매우 유용합니다. 정확한 음성 인식과 빠른 변환 속도가 특징입니다.', 'free',
  ARRAY['음성-텍스트 변환', '회의록 작성', '실시간 변환', '다국어 지원'],
  'https://daglo.ai/logo.png',
  'https://daglo.ai'),
('Designify', '디자인 작업을 쉽고 빠르게 도와주는 AI 도구입니다. 이미지 편집과 생성을 자동화하여 디자인 작업의 효율성을 높여줍니다.', 'free',
  ARRAY['이미지 편집', '자동 디자인', '템플릿 제공', '이미지 생성'],
  'https://designify.com/logo.png',
  'https://designify.com'),
('바드', '구글이 개발한 다목적 AI 도구로, 텍스트 생성, 코드 작성, 분석 등 다양한 작업을 지원합니다. 빠르고 정확한 응답으로 업무 효율성을 높여줍니다.', 'free',
  ARRAY['텍스트 생성', '코드 작성', '데이터 분석', '질의응답'],
  'https://bard.google.com/images/logo.png',
  'https://bard.google.com'),
('아보카도', '다양한 업무를 지원하는 종합 AI 도구입니다. 문서 작성, 데이터 분석, 이미지 편집 등 여러 기능을 통합적으로 제공하여 업무 효율성을 향상시킵니다.', 'free',
  ARRAY['문서 작성', '데이터 분석', '이미지 편집', '업무 자동화'],
  'https://avocado.ai/logo.png',
  ''),
('릴리스 AI', '영상, 음성, PDF, 웹사이트 등 다양한 형태의 콘텐츠를 자동으로 요약해주는 AI 서비스입니다. 특히 유튜브 영상의 요약과 챕터 생성 기능이 특화되어 있어, 긴 영상 콘텐츠를 효율적으로 파악하고 활용할 수 있습니다.', 'free',
  ARRAY['영상 요약', '음성 요약', 'PDF 요약', '웹사이트 요약', '유튜브 챕터 생성'],
  'https://lilys.ai/logo.png',
  ''),
('피카 AI', '이미지나 텍스트를 기반으로 창의적인 동영상을 생성하는 AI 플랫폼입니다. 간단한 클릭으로 다양한 특수 효과를 적용할 수 있으며, 독특하고 매력적인 동영상 콘텐츠를 손쉽게 제작할 수 있습니다.', 'free',
  ARRAY['이미지 기반 동영상 생성', '텍스트 기반 동영상 생성', '특수 효과 적용', '원클릭 편집'],
  'https://pika.art/logo.png',
  'https://www.pika.art'),
('Jasper AI', '강력한 AI 기반 콘텐츠 제작 도구로, 매력적인 소셜 미디어 캡션부터 블로그 포스트까지 다양한 형태의 콘텐츠를 생성할 수 있습니다. 여러 플랫폼에서 콘텐츠를 효과적으로 재활용할 수 있는 기능을 제공합니다.', 'paid',
  ARRAY['소셜 미디어 캡션 생성', '블로그 포스트 작성', '콘텐츠 재활용', '다국어 지원'],
  'https://www.jasper.ai/images/logo.svg',
  'https://www.jasper.ai'),
('TextCortex', '다양한 언어로 맞춤형 콘텐츠를 생성할 수 있는 AI 도구입니다. 소셜 미디어 플랫폼을 포함한 모든 웹사이트에서 사용 가능하며, 개인화된 대화형 콘텐츠 생성을 지원합니다.', 'free_trial',
  ARRAY['다국어 콘텐츠 생성', '웹사이트 통합', '개인화된 대화', '자동 번역'],
  'https://textcortex.com/logo.png',
  ''),
('Lately AI', '긴 형식의 콘텐츠를 소셜 미디어에 최적화된 포스트로 자동 변환해주는 AI 글쓰기 도구입니다. 블로그 게시물이나 동영상을 효과적인 소셜 미디어 콘텐츠로 변환하여 마케팅 효과를 극대화합니다.', 'paid',
  ARRAY['콘텐츠 자동 변환', '소셜 미디어 최적화', '콘텐츠 일정 관리', '성과 분석'],
  'https://www.lately.ai/img/lately-logo.svg',
  ''),
('HubSpot AI', '고객 관리와 마케팅 자동화를 위한 종합 AI 플랫폼입니다. 데이터 기반의 분석과 예측, 이메일 마케팅, 소셜 미디어 관리 등을 통합적으로 제공하여 효과적인 마케팅 전략 수립을 지원합니다.', 'paid',
  ARRAY['고객 관리', '마케팅 자동화', '데이터 분석', '이메일 마케팅', '소셜 미디어 관리'],
  'https://www.hubspot.com/hubfs/HubSpot_Logo.png',
  ''),
('Predis.ai', '소셜 미디어 콘텐츠 생성과 분석에 특화된 AI 도구입니다. 기업, 인플루언서, 블로거들이 효과적으로 소셜 미디어 presence를 구축하고 관리할 수 있도록 도와줍니다.', 'free_trial',
  ARRAY['콘텐츠 생성', '소셜 미디어 분석', '인사이트 제공', '성과 최적화'],
  'https://predis.ai/logo.png',
  ''),
('Perplexity AI', 'AI 기반의 지능형 검색 및 리서치 도구입니다. 기존 검색 엔진과 달리 대화형 인터페이스를 통해 복잡한 질문에 대한 정확하고 상세한 답변을 제공하며, 실시간 정보 업데이트와 소스 인용 기능을 제공합니다.', 'free_trial',
  ARRAY['실시간 정보 검색', '소스 인용', '대화형 검색', '파일 분석', '멀티모달 검색'],
  'https://images.crunchbase.com/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco,dpr_1/hoz3ba3jm2b0hm7aw6sq',
  'https://perplexity.ai'),
('Tiro AI', '한국어에 특화된 AI 기반 글쓰기 및 교정 도구입니다. 맞춤법 검사부터 문체 개선, 문장 구조 최적화까지 제공하며, 특히 학술 논문, 공문서, 비즈니스 문서 작성에 강점이 있습니다.', 'free_trial',
  ARRAY['한국어 맞춤법 검사', '문체 개선', '문장 구조 최적화', '실시간 교정', '학술 논문 특화'],
  'https://tiro.com/static/images/tiro-logo.png',
  'https://tiro.com'),
('Cutback', '전문적인 비디오 편집을 위한 AI 기반 자동화 도구입니다. 스포츠, 결혼식, 여행 등 다양한 장르의 영상을 자동으로 편집하며, 하이라이트 생성과 음악 싱크 기능을 제공합니다. 특히 액션캠 영상 편집에 특화되어 있습니다.', 'paid',
  ARRAY['자동 하이라이트 생성', '음악 싱크', '스포츠 영상 특화', '템플릿 제공', '클라우드 저장'],
  'https://cutback.video/wp-content/uploads/2023/12/cutback-logo-1.svg',
  'https://cutback.video/ko/'),
('Filmora AI', 'Wondershare의 AI 기반 비디오 편집 소프트웨어입니다. 직관적인 인터페이스와 함께 AI 기능을 활용하여 전문적인 영상 편집이 가능합니다. 자동 자막 생성, 배경 제거, 스마트 컷팅 등 다양한 AI 기능을 제공합니다.', 'paid',
  ARRAY['AI 자막 생성', '배경 제거', '스마트 컷팅', '특수 효과', '오디오 향상'],
  'https://images.wondershare.com/filmora/brand/filmora-logo-color.svg',
  'https://filmora.wondershare.net/kr/ad/filmora-brand.html'),
('Sora', 'OpenAI가 개발한 혁신적인 텍스트-투-비디오 생성 AI입니다. 자연스러운 움직임과 복잡한 장면을 생성할 수 있으며, 텍스트 설명만으로 고품질의 비디오를 제작할 수 있습니다. 현실적인 물리 효과와 다양한 카메라 움직임을 지원합니다.', 'paid',
  ARRAY['텍스트 기반 비디오 생성', '자연스러운 움직임', '복잡한 장면 생성', '물리 효과', '다양한 카메라 앵글'],
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/OpenAI_Logo.svg/1024px-OpenAI_Logo.svg.png',
  'https://openai.com/sora'),
('Suno', 'AI를 활용한 음악 창작 플랫폼입니다. 텍스트 설명만으로 완성도 높은 음악을 생성할 수 있으며, 다양한 장르와 스타일의 음악 제작이 가능합니다. 보컬, 악기, 편곡을 모두 AI로 생성하여 전문적인 음악 제작을 지원합니다.', 'free_trial',
  ARRAY['AI 작곡', '보컬 생성', '다중 악기 지원', '장르 커스터마이징', '고품질 오디오 출력'],
  'https://assets-global.website-files.com/6502af467b2a8c4ee8159a5b/6502b22993b683b1a9f51db9_favicon.png',
  'https://suno.com/home');

-- 카테고리 할당
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE 
  (t.title = 'ChatGPT' AND c.name IN ('문서 작성', '코딩', '리서치 및 검색')) OR
  (t.title = 'Grammarly' AND c.name IN ('문서 작성', '생산성')) OR
  (t.title = 'Copy.ai' AND c.name IN ('문서 작성', '마케팅 자동화', '콘텐츠 제작')) OR
  (t.title = 'Tableau' AND c.name IN ('데이터 분석', '생산성')) OR
  (t.title = 'Power BI' AND c.name IN ('데이터 분석', '생산성')) OR
  (t.title = 'DataRobot' AND c.name IN ('데이터 분석', '생산성')) OR
  (t.title = 'DALL-E' AND c.name IN ('이미지 생성', '디자인', '콘텐츠 제작')) OR
  (t.title = 'Midjourney' AND c.name IN ('이미지 생성', '디자인', '콘텐츠 제작')) OR
  (t.title = 'Stable Diffusion' AND c.name IN ('이미지 생성', '디자인', '콘텐츠 제작')) OR
  (t.title = 'Murf AI' AND c.name IN ('오디오 생성', '음성 및 오디오', '콘텐츠 제작')) OR
  (t.title = 'Descript' AND c.name IN ('오디오 생성', '음성 및 오디오', '비디오 생성')) OR
  (t.title = 'LOVO AI' AND c.name IN ('오디오 생성', '음성 및 오디오', '콘텐츠 제작')) OR
  (t.title = 'Cutback' AND c.name IN ('비디오 생성', '콘텐츠 제작')) OR
  (t.title = 'Filmora AI' AND c.name IN ('비디오 생성', '콘텐츠 제작')) OR
  (t.title = 'Sora' AND c.name IN ('비디오 생성', '콘텐츠 제작')) OR
  (t.title = 'Suno' AND c.name IN ('오디오 생성', '음성 및 오디오', '콘텐츠 제작')) OR
  (t.title = 'GitHub Copilot' AND c.name IN ('코딩', '생산성')) OR
  (t.title = 'Amazon CodeWhisperer' AND c.name IN ('코딩', '생산성')) OR
  (t.title = 'Tabnine' AND c.name IN ('코딩', '생산성')) OR
  (t.title = 'Canva AI' AND c.name IN ('디자인', '콘텐츠 제작')) OR
  (t.title = 'Galileo AI' AND c.name IN ('디자인', '생산성')) OR
  (t.title = 'Looka' AND c.name IN ('디자인', '콘텐츠 제작')) OR
  (t.title = 'Creatie.ai' AND c.name IN ('디자인', '생산성')) OR
  (t.title = 'DeepL' AND c.name IN ('언어 및 번역', '생산성')) OR
  (t.title = '바드' AND c.name IN ('문서 작성', '코딩', '리서치 및 검색')) OR
  (t.title = 'Designify' AND c.name IN ('디자인', '이미지 생성')) OR
  (t.title = '아보카도' AND c.name IN ('문서 작성', '생산성', '리서치 및 검색')) OR
  (t.title = '피카 AI' AND c.name IN ('비디오 생성', '콘텐츠 제작')) OR
  (t.title = 'Jasper AI' AND c.name IN ('문서 작성', '마케팅 자동화', '콘텐츠 제작')) OR
  (t.title = 'TextCortex' AND c.name IN ('문서 작성', '마케팅 자동화', '콘텐츠 제작'));

-- 릴리스 AI의 카테고리를 서비스 목적에 맞게 수정
DELETE FROM tool_categories 
WHERE tool_id IN (SELECT id FROM tools WHERE title = 'Release AI');

INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE t.title = 'Release AI' AND c.name IN ('리서치 및 검색', '콘텐츠 제작', '생산성');

-- 기존 도구들의 website_url 업데이트
UPDATE tools SET website_url = 'https://chat.openai.com' WHERE title = 'ChatGPT';
UPDATE tools SET website_url = 'https://www.grammarly.com' WHERE title = 'Grammarly';
UPDATE tools SET website_url = 'https://www.copy.ai' WHERE title = 'Copy.ai';
UPDATE tools SET website_url = 'https://www.tableau.com' WHERE title = 'Tableau';
UPDATE tools SET website_url = 'https://powerbi.microsoft.com' WHERE title = 'Power BI';
UPDATE tools SET website_url = 'https://www.datarobot.com' WHERE title = 'DataRobot';
UPDATE tools SET website_url = 'https://openai.com/dall-e-3' WHERE title = 'DALL-E';
UPDATE tools SET website_url = 'https://www.midjourney.com' WHERE title = 'Midjourney';
UPDATE tools SET website_url = 'https://stability.ai' WHERE title = 'Stable Diffusion';
UPDATE tools SET website_url = 'https://murf.ai' WHERE title = 'Murf AI';
UPDATE tools SET website_url = 'https://www.descript.com' WHERE title = 'Descript';
UPDATE tools SET website_url = 'https://www.lovo.ai' WHERE title = 'LOVO AI';
UPDATE tools SET website_url = 'https://www.synthesia.io' WHERE title = 'Synthesia';
UPDATE tools SET website_url = 'https://runwayml.com' WHERE title = 'Runway';
UPDATE tools SET website_url = 'https://www.pika.art' WHERE title = 'Pika Labs';
UPDATE tools SET website_url = 'https://github.com/features/copilot' WHERE title = 'GitHub Copilot';
UPDATE tools SET website_url = 'https://aws.amazon.com/codewhisperer' WHERE title = 'Amazon CodeWhisperer';
UPDATE tools SET website_url = 'https://www.tabnine.com' WHERE title = 'Tabnine';
UPDATE tools SET website_url = 'https://www.canva.com' WHERE title = 'Canva AI';
UPDATE tools SET website_url = 'https://www.galileo.ai' WHERE title = 'Galileo AI';
UPDATE tools SET website_url = 'https://looka.com' WHERE title = 'Looka';

-- 최근 추가된 도구들의 website_url 업데이트
UPDATE tools SET website_url = 'https://cutback.video/ko/' WHERE title = 'Cutback';
UPDATE tools SET website_url = 'https://filmora.wondershare.net/kr/ad/filmora-brand.html' WHERE title = 'Filmora AI';
UPDATE tools SET website_url = 'https://openai.com/sora' WHERE title = 'Sora';
UPDATE tools SET website_url = 'https://suno.com/home' WHERE title = 'Suno';
UPDATE tools SET website_url = 'https://perplexity.ai' WHERE title = 'Perplexity AI';
UPDATE tools SET website_url = 'https://tiro.com' WHERE title = 'Tiro AI';

INSERT INTO tools (title, description, price_type, features, image_url, website_url) VALUES
('Daglo', '다글로는 한국어에 특화된 AI 글쓰기 도우미입니다. 문서 작성, 교정, 번역부터 맞춤법, 문법까지 쉽게 해결할 수 있는 기능을 제공합니다.', 'free_trial',
  ARRAY['한국어 특화', '맞춤법/문법 검사', '번역', 'AI 글쓰기'],
  'https://daglo.ai/images/logo.svg',
  'https://daglo.ai/');

-- Add categories for Daglo
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE t.title = 'Daglo'
AND c.name IN ('문서 작성', '번역');

-- Update missing website URLs
UPDATE tools SET website_url = 'https://www.jasper.ai' WHERE title = 'Jasper AI';
UPDATE tools SET website_url = 'https://www.creatie.ai' WHERE title = 'Creatie.ai';
UPDATE tools SET website_url = 'https://www.deepl.com' WHERE title = 'DeepL';
UPDATE tools SET website_url = 'https://designify.com' WHERE title = 'Designify';
UPDATE tools SET website_url = 'https://bard.google.com' WHERE title = '바드';

-- Add categories for remaining tools
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE (
  (t.title = 'Perplexity AI' AND c.name IN ('리서치 및 검색', '생산성')) OR
  (t.title = 'Tiro AI' AND c.name IN ('문서 작성', '생산성')) OR
  (t.title = 'Predis.ai' AND c.name IN ('소셜 미디어', '마케팅 자동화', '콘텐츠 제작')) OR
  (t.title = 'Synthesia' AND c.name IN ('비디오 생성', '콘텐츠 제작')) OR
  (t.title = 'Runway' AND c.name IN ('비디오 생성', '콘텐츠 제작'))
)
AND NOT EXISTS (
  SELECT 1 FROM tool_categories tc
  WHERE tc.tool_id = t.id AND tc.category_id = c.id
);

-- Add categories for remaining tools
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id
FROM tools t, categories c
WHERE (
  (t.title = '다글로' AND c.name IN ('음성 및 오디오', '문서 작성', '생산성')) OR
  (t.title = 'Perplexity AI' AND c.name IN ('리서치 및 검색', '생산성')) OR
  (t.title = 'Tiro AI' AND c.name IN ('문서 작성', '생산성')) OR
  (t.title = 'Predis.ai' AND c.name IN ('소셜 미디어', '마케팅 자동화', '콘텐츠 제작')) OR
  (t.title = 'Synthesia' AND c.name IN ('비디오 생성', '콘텐츠 제작')) OR
  (t.title = 'Runway' AND c.name IN ('비디오 생성', '콘텐츠 제작'))
)
AND NOT EXISTS (
  SELECT 1 FROM tool_categories tc
  WHERE tc.tool_id = t.id AND tc.category_id = c.id
);

-- 중복된 도구 제거
DELETE FROM tools a USING (
  SELECT MIN(id) as id, title
  FROM tools 
  GROUP BY title
  HAVING COUNT(*) > 1
) b
WHERE a.title = b.title 
AND a.id > b.id;
