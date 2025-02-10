-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS profiles;

-- Create profiles table for user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create tools table for AI tools
CREATE TABLE tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('free', 'paid', 'free_trial')),
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
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

-- Insert sample data
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
-- 문서 작성
('ChatGPT', '자연어 처리 기반의 강력한 텍스트 생성 AI입니다.', '문서 작성', 'free_trial', 
  ARRAY['자연어 대화', '문서 작성', '질문 답변'],
  'https://static.vecteezy.com/system/resources/previews/021/608/790/original/chatgpt-logo-chat-gpt-icon-on-black-background-free-vector.jpg'),
('Grammarly', '전문적인 글쓰기를 위한 AI 기반 문법 및 문체 교정 도구입니다.', '문서 작성', 'free_trial',
  ARRAY['문법 검사', '문체 개선', '맞춤법 교정'],
  'https://static.vecteezy.com/system/resources/previews/024/555/389/non_2x/grammarly-logo-brand-symbol-app-icon-design-free-vector.jpg'),
('Copy.ai', '마케팅 콘텐츠 제작을 위한 AI 작문 도구입니다.', '문서 작성', 'free',
  ARRAY['블로그 작성', '광고 문구', '소셜 미디어 콘텐츠'],
  'https://assets-global.website-files.com/628288c5cd3e8411b90a36a4/62828b9d28d77a5155db01d0_favicon-256.png'),

-- 데이터 분석
('Tableau', '데이터 시각화 및 비즈니스 인텔리전스 플랫폼입니다.', '데이터 분석', 'paid',
  ARRAY['대시보드 생성', '데이터 시각화', '실시간 분석'],
  'https://logos-world.net/wp-content/uploads/2021/10/Tableau-Logo.png'),
('Power BI', '마이크로소프트의 데이터 분석 및 시각화 도구입니다.', '데이터 분석', 'free_trial',
  ARRAY['데이터 모델링', '리포트 생성', '협업 기능'],
  'https://static.vecteezy.com/system/resources/previews/022/100/686/non_2x/microsoft-power-bi-logo-free-png.png'),
('DataRobot', '자동화된 머신러닝 플랫폼으로 예측 모델을 구축합니다.', '데이터 분석', 'paid',
  ARRAY['자동 ML', '예측 분석', '모델 배포'],
  'https://www.datarobot.com/wp-content/uploads/2021/07/DataRobot_Logo_Teal_RGB-1.png'),

-- 이미지 생성
('DALL-E', 'OpenAI의 텍스트 기반 이미지 생성 AI입니다.', '이미지 생성', 'paid',
  ARRAY['텍스트 투 이미지', '이미지 편집', '스타일 변환'],
  'https://static.vecteezy.com/system/resources/previews/021/059/827/original/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg'),
('Midjourney', '고품질 아트워크를 생성하는 AI 도구입니다.', '이미지 생성', 'paid',
  ARRAY['아트워크 생성', '스타일 커스텀', '고해상도 출력'],
  'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png'),
('Stable Diffusion', '오픈소스 기반의 이미지 생성 AI입니다.', '이미지 생성', 'free',
  ARRAY['로컬 설치', '커스텀 모델', '배치 처리'],
  'https://static.vecteezy.com/system/resources/previews/024/811/036/non_2x/stable-diffusion-logo-free-vector.jpg'),

-- 오디오 생성
('Murf AI', '전문적인 AI 음성 생성 및 더빙 플랫폼입니다.', '오디오 생성', 'free_trial',
  ARRAY['다국어 지원', '감정 표현', '실시간 변환'],
  'https://assets-global.website-files.com/62a1d5fd0cc3785e6a39dfcd/62a1d5fd0cc378fd1139e108_logo.svg'),
('Descript', '오디오 및 비디오 편집을 위한 올인원 플랫폼입니다.', '오디오 생성', 'free_trial',
  ARRAY['음성 복제', '텍스트 기반 편집', '노이즈 제거'],
  'https://assets-global.website-files.com/5d761d627a6dfa6a5b28ab12/5e46171c82e2f32e33dd1d27_descript-favicon-2020.png'),
('LOVO AI', '자연스러운 AI 음성을 생성하는 도구입니다.', '오디오 생성', 'paid',
  ARRAY['음성 합성', '감정 제어', '실시간 변환'],
  'https://www.lovo.ai/images/lovo-logo.svg'),

-- 비디오 생성
('Synthesia', '텍스트를 전문적인 비디오로 변환하는 AI 플랫폼입니다.', '비디오 생성', 'paid',
  ARRAY['아바타 생성', '다국어 지원', '템플릿 제공'],
  'https://cdn.synthesia.io/web/synthesia_logo_black.png'),
('Runway', '고급 비디오 편집 및 생성을 위한 AI 도구입니다.', '비디오 생성', 'free_trial',
  ARRAY['비디오 편집', '특수 효과', '모션 그래픽'],
  'https://storage.googleapis.com/runwayml-website-assets/homepage/brand-logo.png'),
('Pika Labs', '텍스트 설명으로 비디오를 생성하는 AI 도구입니다.', '비디오 생성', 'free_trial',
  ARRAY['텍스트 투 비디오', '스타일 전이', '장면 생성'],
  'https://pika.art/pika-logo.png'),

-- 코딩
('GitHub Copilot', 'AI 기반 코드 자동 완성 및 제안 도구입니다.', '코딩', 'paid',
  ARRAY['코드 제안', '문서화', '버그 감지'],
  'https://github.gallerycdn.vsassets.io/extensions/github/copilot/1.138.0/1701196227291/Microsoft.VisualStudio.Services.Icons.Default'),
('Amazon CodeWhisperer', '아마존의 AI 코딩 어시스턴트입니다.', '코딩', 'free_trial',
  ARRAY['코드 생성', '보안 검사', 'AWS 통합'],
  'https://d2908q01vomqb2.cloudfront.net/7719a1c782a1ba91c031a682a0a2f8658209adbf/2023/03/10/codewhisperer.png'),
('Tabnine', '딥러닝 기반의 코드 자동 완성 도구입니다.', '코딩', 'free',
  ARRAY['다중 언어 지원', '커스텀 트레이닝', '팀 협업'],
  'https://assets-global.website-files.com/627a5aabcf5e376a2ac6c176/6398b0d30b15ed4d5fab6931_tabnine-logo.png'),

-- 디자인
('Canva AI', 'AI 기능이 통합된 그래픽 디자인 플랫폼입니다.', '디자인', 'free_trial',
  ARRAY['템플릿 제공', '이미지 생성', '자동 리사이즈'],
  'https://static.canva.com/web/images/12487a1e0770d29351bd4ce4f87ec8fe.svg'),
('Galileo AI', 'AI 기반 UI/UX 디자인 도구입니다.', '디자인', 'paid',
  ARRAY['UI 생성', '프로토타입', '컴포넌트 추출'],
  'https://framerusercontent.com/images/nXLdc1LsU15dk6AODEpMgByLD0.png'),
('Looka', '로고 및 브랜드 디자인을 위한 AI 플랫폼입니다.', '디자인', 'free_trial',
  ARRAY['로고 디자인', '브랜드 키트', '소셜 미디어 키트'],
  'https://looka.com/wp-content/themes/looka/images/logos/looka_logo_black.svg');
