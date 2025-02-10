import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { supabase } from '../config/supabase';

const Home = () => {
  const [searchParams] = useSearchParams();
  const [tools, setTools] = useState([]);
  const [category, setCategory] = useState('전체 카테고리');
  const [priceType, setPriceType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTools();
  }, [category, priceType, searchParams]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const searchQuery = searchParams.get('search');
      
      // 기본 쿼리 설정
      let query = supabase.from('tools').select('*');

      // 검색어가 있는 경우
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase().trim();
        
        // 가격 타입 매핑
        let matchedPriceType = null;
        if (searchLower === '무료') matchedPriceType = 'free';
        else if (searchLower === '유료') matchedPriceType = 'paid';
        else if (searchLower === '무료체험') matchedPriceType = 'free_trial';
        
        if (matchedPriceType) {
          // 가격 타입 검색인 경우
          query = query.eq('price_type', matchedPriceType);
        } else {
          // 일반 검색인 경우
          query = query.or(
            `title.ilike.%${searchLower}%,` +
            `description.ilike.%${searchLower}%,` +
            `category.ilike.%${searchLower}%`
          );
        }
      }
      
      // 카테고리 필터
      if (category !== '전체 카테고리') {
        query = query.eq('category', category);
      }
      
      // 가격 타입 필터
      if (priceType !== 'all') {
        query = query.eq('price_type', priceType);
      }

      let { data, error } = await query;
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // features 배열에서 추가 필터링
      if (searchQuery && data && !['무료', '유료', '무료체험'].includes(searchQuery.trim())) {
        const searchLower = searchQuery.toLowerCase().trim();
        data = data.filter(tool => 
          tool.features.some(feature =>
            feature.toLowerCase().includes(searchLower)
          )
        );
      }

      console.log('Search results:', {
        searchQuery,
        category,
        priceType,
        resultCount: data?.length,
        results: data
      });

      setTools(data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-[60px] pb-[80px]">
      <div className="p-4 flex items-center justify-start gap-4 bg-[#1a1d24]">
        <div className="relative min-w-[160px]">
          <select 
            className="w-full appearance-none bg-[#1e2128] border border-[#2b2f38] text-[15px] px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>전체 카테고리</option>
            <option>문서 작성</option>
            <option>데이터 분석</option>
            <option>이미지 생성</option>
            <option>오디오 생성</option>
            <option>비디오 생성</option>
            <option>코딩</option>
            <option>디자인</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        <div className="relative min-w-[140px]">
          <select 
            className="w-full appearance-none bg-[#1e2128] border border-[#2b2f38] text-[15px] px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
            value={priceType}
            onChange={(e) => setPriceType(e.target.value)}
          >
            <option value="all">전체 가격</option>
            <option value="free">무료</option>
            <option value="paid">유료</option>
            <option value="free_trial">무료체험</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {loading ? (
          <div className="col-span-full text-center py-8">로딩중...</div>
        ) : tools.length > 0 ? (
          tools.map((tool) => (
            <Link key={tool.id} to={`/tool/${tool.id}`}>
              <ToolCard {...tool} />
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            해당하는 AI 도구가 없습니다.
          </div>
        )}
      </div>
    </main>
  );
};

export default Home;
