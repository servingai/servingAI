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
('ChatGPT', '자연어 처리 기반의 강력한 텍스트 생성 AI입니다.', '문서 작성', 'free_trial', 
  ARRAY['자연어 대화', '문서 작성', '질문 답변'],
  'https://static.vecteezy.com/system/resources/previews/021/608/790/original/chatgpt-logo-chat-gpt-icon-on-black-background-free-vector.jpg');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Grammarly', '전문적인 글쓰기를 위한 AI 기반 문법 및 문체 교정 도구입니다.', '문서 작성', 'free_trial',
  ARRAY['문법 검사', '문체 개선', '맞춤법 교정'],
  'https://static.vecteezy.com/system/resources/previews/024/555/389/non_2x/grammarly-logo-brand-symbol-app-icon-design-free-vector.jpg');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Copy.ai', '마케팅 콘텐츠 제작을 위한 AI 작문 도구입니다.', '문서 작성', 'free',
  ARRAY['블로그 작성', '광고 문구', '소셜 미디어 콘텐츠'],
  'https://assets-global.website-files.com/628288c5cd3e8411b90a36a4/62828b9d28d77a5155db01d0_favicon-256.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Tableau', '데이터 시각화 및 비즈니스 인텔리전스 플랫폼입니다.', '데이터 분석', 'paid',
  ARRAY['대시보드 생성', '데이터 시각화', '실시간 분석'],
  'https://logos-world.net/wp-content/uploads/2021/10/Tableau-Logo.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Power BI', '마이크로소프트의 데이터 분석 및 시각화 도구입니다.', '데이터 분석', 'free_trial',
  ARRAY['데이터 모델링', '리포트 생성', '협업 기능'],
  'https://static.vecteezy.com/system/resources/previews/022/100/686/non_2x/microsoft-power-bi-logo-free-png.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('DataRobot', '자동화된 머신러닝 플랫폼으로 예측 모델을 구축합니다.', '데이터 분석', 'paid',
  ARRAY['자동 ML', '예측 분석', '모델 배포'],
  'https://www.datarobot.com/wp-content/uploads/2021/07/DataRobot_Logo_Teal_RGB-1.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('DALL-E', 'OpenAI의 텍스트 기반 이미지 생성 AI입니다.', '이미지 생성', 'paid',
  ARRAY['텍스트 투 이미지', '이미지 편집', '스타일 변환'],
  'https://static.vecteezy.com/system/resources/previews/021/059/827/original/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Midjourney', '고품질 아트워크를 생성하는 AI 도구입니다.', '이미지 생성', 'paid',
  ARRAY['아트워크 생성', '스타일 커스텀', '고해상도 출력'],
  'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Stable Diffusion', '오픈소스 기반의 이미지 생성 AI입니다.', '이미지 생성', 'free',
  ARRAY['로컬 설치', '커스텀 모델', '배치 처리'],
  'https://static.vecteezy.com/system/resources/previews/024/811/036/non_2x/stable-diffusion-logo-free-vector.jpg');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Murf AI', '전문적인 AI 음성 생성 및 더빙 플랫폼입니다.', '오디오 생성', 'free_trial',
  ARRAY['다국어 지원', '감정 표현', '실시간 변환'],
  'https://assets-global.website-files.com/62a1d5fd0cc3785e6a39dfcd/62a1d5fd0cc378fd1139e108_logo.svg');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Descript', '오디오 및 비디오 편집을 위한 올인원 플랫폼입니다.', '오디오 생성', 'free_trial',
  ARRAY['음성 복제', '텍스트 기반 편집', '노이즈 제거'],
  'https://assets-global.website-files.com/5d761d627a6dfa6a5b28ab12/5e46171c82e2f32e33dd1d27_descript-favicon-2020.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('LOVO AI', '자연스러운 AI 음성을 생성하는 도구입니다.', '오디오 생성', 'paid',
  ARRAY['음성 합성', '감정 제어', '실시간 변환'],
  'https://www.lovo.ai/images/lovo-logo.svg');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Synthesia', '텍스트를 전문적인 비디오로 변환하는 AI 플랫폼입니다.', '비디오 생성', 'paid',
  ARRAY['아바타 생성', '다국어 지원', '템플릿 제공'],
  'https://cdn.synthesia.io/web/synthesia_logo_black.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Runway', '고급 비디오 편집 및 생성을 위한 AI 도구입니다.', '비디오 생성', 'free_trial',
  ARRAY['비디오 편집', '특수 효과', '모션 그래픽'],
  'https://storage.googleapis.com/runwayml-website-assets/homepage/brand-logo.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Pika Labs', '텍스트 설명으로 비디오를 생성하는 AI 도구입니다.', '비디오 생성', 'free_trial',
  ARRAY['텍스트 투 비디오', '스타일 전이', '장면 생성'],
  'https://pika.art/pika-logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('GitHub Copilot', 'AI 기반 코드 자동 완성 및 제안 도구입니다.', '코딩', 'paid',
  ARRAY['코드 제안', '문서화', '버그 감지'],
  'https://github.gallerycdn.vsassets.io/extensions/github/copilot/1.138.0/1701196227291/Microsoft.VisualStudio.Services.Icons.Default');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Amazon CodeWhisperer', '아마존의 AI 코딩 어시스턴트입니다.', '코딩', 'free_trial',
  ARRAY['코드 생성', '보안 검사', 'AWS 통합'],
  'https://d2908q01vomqb2.cloudfront.net/7719a1c782a1ba91c031a682a0a2f8658209adbf/2023/03/10/codewhisperer.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Tabnine', '딥러닝 기반의 코드 자동 완성 도구입니다.', '코딩', 'free',
  ARRAY['다중 언어 지원', '커스텀 트레이닝', '팀 협업'],
  'https://assets-global.website-files.com/627a5aabcf5e376a2ac6c176/6398b0d30b15ed4d5fab6931_tabnine-logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Canva AI', 'AI 기능이 통합된 그래픽 디자인 플랫폼입니다.', '디자인', 'free_trial',
  ARRAY['템플릿 제공', '이미지 생성', '자동 리사이즈'],
  'https://static.canva.com/web/images/12487a1e0770d29351bd4ce4f87ec8fe.svg');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Galileo AI', 'AI 기반 UI/UX 디자인 도구입니다.', '디자인', 'paid',
  ARRAY['UI 생성', '프로토타입', '컴포넌트 추출'],
  'https://framerusercontent.com/images/nXLdc1LsU15dk6AODEpMgByLD0.png');
INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Looka', '로고 및 브랜드 디자인을 위한 AI 플랫폼입니다.', '디자인', 'free_trial',
  ARRAY['로고 디자인', '브랜드 키트', '소셜 미디어 키트'],
  'https://looka.com/wp-content/themes/looka/images/logos/looka_logo_black.svg');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Creatie.ai', 'AI 기반 제품 디자인 소프트웨어로 디자이너의 작업 과정을 효율적으로 만들어줍니다. 고품질 목업 생성, 자동 스타일 가이드 생성, 아이콘 제작, 이미지 개선 등 다양한 기능을 제공합니다. 팀 협업에 최적화되어 있으며, 프로토타이핑과 디자인 핸드오프를 지원합니다.', '디자인', 'free',
  ARRAY['AI 목업 생성', '스타일 가이드 자동화', '아이콘 생성', '이미지 개선', '팀 협업'],
  'https://creatie.ai/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('DeepL', '정확하고 자연스러운 번역을 제공하는 AI 기반 번역 서비스입니다. 다양한 언어 간의 고품질 번역을 지원하며, 전문적인 문서 번역에도 적합합니다.', '언어 및 번역', 'free',
  ARRAY['자연스러운 번역', '다국어 지원', '문서 번역', '실시간 번역'],
  'https://static.deepl.com/img/logo/deepl-logo-blue.svg');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('다글로', '음성을 텍스트로 변환해주는 AI 서비스로, 회의록 작성과 음성 콘텐츠 제작에 매우 유용합니다. 정확한 음성 인식과 빠른 변환 속도가 특징입니다.', '음성 및 오디오', 'free',
  ARRAY['음성-텍스트 변환', '회의록 작성', '실시간 변환', '다국어 지원'],
  'https://daglo.ai/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Designify', '디자인 작업을 쉽고 빠르게 도와주는 AI 도구입니다. 이미지 편집과 생성을 자동화하여 디자인 작업의 효율성을 높여줍니다.', '디자인', 'free',
  ARRAY['이미지 편집', '자동 디자인', '템플릿 제공', '이미지 생성'],
  'https://designify.com/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('바드', '구글이 개발한 다목적 AI 도구로, 텍스트 생성, 코드 작성, 분석 등 다양한 작업을 지원합니다. 빠르고 정확한 응답으로 업무 효율성을 높여줍니다.', '생산성', 'free',
  ARRAY['텍스트 생성', '코드 작성', '데이터 분석', '질의응답'],
  'https://bard.google.com/images/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('아보카도', '다양한 업무를 지원하는 종합 AI 도구입니다. 문서 작성, 데이터 분석, 이미지 편집 등 여러 기능을 통합적으로 제공하여 업무 효율성을 향상시킵니다.', '생산성', 'free',
  ARRAY['문서 작성', '데이터 분석', '이미지 편집', '업무 자동화'],
  'https://avocado.ai/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('릴리스 AI', '영상, 음성, PDF, 웹사이트 등 다양한 형태의 콘텐츠를 자동으로 요약해주는 AI 서비스입니다. 특히 유튜브 영상의 요약과 챕터 생성 기능이 특화되어 있어, 긴 영상 콘텐츠를 효율적으로 파악하고 활용할 수 있습니다.', '콘텐츠 제작', 'free',
  ARRAY['영상 요약', '음성 요약', 'PDF 요약', '웹사이트 요약', '유튜브 챕터 생성'],
  'https://lilys.ai/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('피카 AI', '이미지나 텍스트를 기반으로 창의적인 동영상을 생성하는 AI 플랫폼입니다. 간단한 클릭으로 다양한 특수 효과를 적용할 수 있으며, 독특하고 매력적인 동영상 콘텐츠를 손쉽게 제작할 수 있습니다.', '비디오 제작', 'free',
  ARRAY['이미지 기반 동영상 생성', '텍스트 기반 동영상 생성', '특수 효과 적용', '원클릭 편집'],
  'https://pika.art/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Jasper AI', '강력한 AI 기반 콘텐츠 제작 도구로, 매력적인 소셜 미디어 캡션부터 블로그 포스트까지 다양한 형태의 콘텐츠를 생성할 수 있습니다. 여러 플랫폼에서 콘텐츠를 효과적으로 재활용할 수 있는 기능을 제공합니다.', '콘텐츠 제작', 'paid',
  ARRAY['소셜 미디어 캡션 생성', '블로그 포스트 작성', '콘텐츠 재활용', '다국어 지원'],
  'https://www.jasper.ai/images/logo.svg');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('TextCortex', '다양한 언어로 맞춤형 콘텐츠를 생성할 수 있는 AI 도구입니다. 소셜 미디어 플랫폼을 포함한 모든 웹사이트에서 사용 가능하며, 개인화된 대화형 콘텐츠 생성을 지원합니다.', '콘텐츠 제작', 'free_trial',
  ARRAY['다국어 콘텐츠 생성', '웹사이트 통합', '개인화된 대화', '자동 번역'],
  'https://textcortex.com/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Lately AI', '긴 형식의 콘텐츠를 소셜 미디어에 최적화된 포스트로 자동 변환해주는 AI 글쓰기 도구입니다. 블로그 게시물이나 동영상을 효과적인 소셜 미디어 콘텐츠로 변환하여 마케팅 효과를 극대화합니다.', '소셜 미디어', 'paid',
  ARRAY['콘텐츠 자동 변환', '소셜 미디어 최적화', '콘텐츠 일정 관리', '성과 분석'],
  'https://www.lately.ai/img/lately-logo.svg');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('HubSpot AI', '고객 관리와 마케팅 자동화를 위한 종합 AI 플랫폼입니다. 데이터 기반의 분석과 예측, 이메일 마케팅, 소셜 미디어 관리 등을 통합적으로 제공하여 효과적인 마케팅 전략 수립을 지원합니다.', '마케팅 자동화', 'paid',
  ARRAY['고객 관리', '마케팅 자동화', '데이터 분석', '이메일 마케팅', '소셜 미디어 관리'],
  'https://www.hubspot.com/hubfs/HubSpot_Logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Predis.ai', '소셜 미디어 콘텐츠 생성과 분석에 특화된 AI 도구입니다. 기업, 인플루언서, 블로거들이 효과적으로 소셜 미디어 presence를 구축하고 관리할 수 있도록 도와줍니다.', '소셜 미디어', 'free_trial',
  ARRAY['콘텐츠 생성', '소셜 미디어 분석', '인사이트 제공', '성과 최적화'],
  'https://predis.ai/logo.png');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Perplexity AI', 'AI 기반의 지능형 검색 및 리서치 도구입니다. 기존 검색 엔진과 달리 대화형 인터페이스를 통해 복잡한 질문에 대한 정확하고 상세한 답변을 제공하며, 실시간 정보 업데이트와 소스 인용 기능을 제공합니다.', '리서치 및 검색', 'free_trial',
  ARRAY['실시간 정보 검색', '소스 인용', '대화형 검색', '파일 분석', '멀티모달 검색'],
  'https://images.crunchbase.com/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco,dpr_1/hoz3ba3jm2b0hm7aw6sq');

INSERT INTO tools (title, description, category, price_type, features, image_url) VALUES
('Tiro AI', '한국어에 특화된 AI 기반 글쓰기 및 교정 도구입니다. 맞춤법 검사부터 문체 개선, 문장 구조 최적화까지 제공하며, 특히 학술 논문, 공문서, 비즈니스 문서 작성에 강점이 있습니다.', '문서 작성', 'free_trial',
  ARRAY['한국어 맞춤법 검사', '문체 개선', '문장 구조 최적화', '실시간 교정', '학술 논문 특화'],
  'https://tiro.com/static/images/tiro-logo.png');
