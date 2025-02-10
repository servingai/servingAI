import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { supabase } from '../config/supabase';
import { PlusIcon, XMarkIcon, ChatBubbleLeftIcon, PaperAirplaneIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [priceType, setPriceType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const categoryFilterRef = useRef(null);
  const priceFilterRef = useRef(null);
  const fabMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target)) {
        setShowCategoryFilter(false);
      }
      if (priceFilterRef.current && !priceFilterRef.current.contains(event.target)) {
        setShowPriceFilter(false);
      }
      if (fabMenuRef.current && !fabMenuRef.current.contains(event.target)) {
        setShowFabMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFabClick = () => {
    setShowFabMenu(!showFabMenu);
  };

  const handleMenuItemClick = (type) => {
    if (type === 'contact') {
      window.open('https://open.kakao.com/o/sGrocqfh', '_blank');
    } else if (type === 'request') {
      window.open('https://k0h.notion.site/196f55643f2080b1b7fcc69890be712a?pvs=105', '_blank');
    }
    setShowFabMenu(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log('Fetching tools due to filters change');
    fetchTools();
  }, [selectedCategories, priceType, searchParams]);

  const handleCategoryChange = (categoryName) => {
    console.log('Category changed:', categoryName);
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      console.log('New selected categories:', Array.from(newSet));
      return newSet;
    });
  };

  const fetchTools = async () => {
    try {
      setLoading(true);
      const searchQuery = searchParams.get('search');
      
      console.log('Fetching tools with categories:', Array.from(selectedCategories));

      // 기본 쿼리 설정
      let query = supabase.from('tools').select(`
        *,
        tool_categories!inner (
          category_id,
          categories!inner (
            id,
            name
          )
        )
      `);

      // 검색어가 있는 경우
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase().trim();
        
        // 가격 타입 매핑
        const priceTypeMap = {
          '무료': 'free',
          '유료': 'paid',
          '무료체험': 'free_trial'
        };
        
        if (priceTypeMap[searchLower]) {
          // 가격 타입 검색인 경우
          query = query.eq('price_type', priceTypeMap[searchLower]);
        } else {
          // 검색어를 단어로 분리
          const searchTerms = searchLower.split(/\s+/).filter(Boolean);
          
          if (searchTerms.length > 0) {
            // 각 검색어에 대한 조건 생성
            const conditions = [];
            
            searchTerms.forEach(term => {
              // 기본 검색 조건
              conditions.push(
                `title.ilike.%${term}%`,
                `description.ilike.%${term}%`
              );
              
              // features 배열에서 검색
              if (term) {
                conditions.push(`features.cs.{${term}}`);
              }
            });

            // 카테고리 검색을 위한 서브쿼리
            const { data: categoryMatches, error: categoryError } = await supabase
              .from('categories')
              .select('id, name')
              .filter('name', 'ilike', `%${searchLower}%`);

            if (!categoryError && categoryMatches?.length > 0) {
              const categoryIds = categoryMatches.map(cat => cat.id);
              
              // 카테고리 ID로 도구 검색
              const { data: toolsWithCategory, error: toolError } = await supabase
                .from('tool_categories')
                .select('tool_id')
                .in('category_id', categoryIds);

              if (!toolError && toolsWithCategory?.length > 0) {
                const toolIds = toolsWithCategory.map(t => t.tool_id);
                conditions.push(`id.in.(${toolIds.join(',')})`);
              }
            }
            
            // 모든 조건을 OR로 결합
            query = query.or(conditions.join(','));
          }
        }
      }
      
      // 가격 타입 필터
      if (priceType !== 'all') {
        query = query.eq('price_type', priceType);
      }

      // 카테고리 필터
      if (selectedCategories.size > 0) {
        query = query.in('tool_categories.categories.name', Array.from(selectedCategories));
      }

      // 정렬
      query = query.order('title');

      const { data: tools, error } = await query;
      
      if (error) {
        console.error('Error fetching tools:', error);
        throw error;
      }

      console.log('Raw tools data:', tools);

      // 중복 제거 및 데이터 정리
      const uniqueTools = Array.from(new Set(tools.map(tool => tool.id)))
        .map(id => {
          const tool = tools.find(t => t.id === id);
          // 카테고리 정보 추출 및 정리
          const categories = tool.tool_categories
            .map(tc => tc.categories?.name)
            .filter(Boolean);
          
          // 검색어 관련성 점수 계산
          let relevanceScore = 0;
          if (searchQuery) {
            const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
            searchTerms.forEach(term => {
              // 제목 매치
              if (tool.title.toLowerCase().includes(term)) relevanceScore += 3;
              // 설명 매치
              if (tool.description.toLowerCase().includes(term)) relevanceScore += 2;
              // 기능 매치
              if (tool.features?.some(f => f.toLowerCase().includes(term))) relevanceScore += 1;
              // 카테고리 매치
              if (categories.some(c => c.toLowerCase().includes(term))) relevanceScore += 2;
            });
          }
          
          return {
            ...tool,
            categories,
            relevanceScore,
            tool_categories: undefined // 원본 데이터 제거
          };
        });

      // 검색어가 있는 경우 관련성 점수로 정렬
      if (searchQuery) {
        uniqueTools.sort((a, b) => b.relevanceScore - a.relevanceScore);
      }

      console.log('Processed tools:', uniqueTools);
      setTools(uniqueTools);
    } catch (error) {
      console.error('Error:', error);
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const priceOptions = [
    { value: 'all', label: '전체 가격' },
    { value: 'free', label: '무료' },
    { value: 'paid', label: '유료' },
    { value: 'free_trial', label: '무료체험' }
  ];

  // 필터 초기화 함수 추가
  const resetFilters = () => {
    setSelectedCategories(new Set());
    setPriceType('all');
    setSearchParams('');
  };

  return (
    <main className="pt-[60px] pb-[140px] min-h-screen bg-[#171717]">
      <div className="sticky top-[60px] z-40 bg-[#171717] border-b border-[#2b2f38]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="py-4 flex items-center gap-2">
            {/* 카테고리 필터 */}
            <div className="relative" ref={categoryFilterRef}>
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="px-4 py-2 bg-[#1e2128] border border-[#2b2f38] rounded-xl hover:border-[#3d4251] transition-colors flex items-center gap-2"
              >
                <span className="text-sm">카테고리</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`} />
              </button>
              
              {showCategoryFilter && (
                <div className="absolute z-50 mt-2 w-64 bg-[#1e2128] border border-[#2b2f38] rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategories(new Set())}
                    className="w-full flex items-center p-2 hover:bg-[#2b2f38] rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.size === 0}
                      readOnly
                      className="form-checkbox h-4 w-4 text-[#3B82F6] rounded border-[#2b2f38]"
                    />
                    <span className="ml-2 text-sm">전체 카테고리</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryChange(cat.name)}
                      className="w-full flex items-center p-2 hover:bg-[#2b2f38] rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.has(cat.name)}
                        readOnly
                        className="form-checkbox h-4 w-4 text-[#3B82F6] rounded border-[#2b2f38]"
                      />
                      <span className="ml-2 text-sm">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* 가격 필터 */}
            <div className="relative" ref={priceFilterRef}>
              <button
                onClick={() => setShowPriceFilter(!showPriceFilter)}
                className="px-4 py-2 bg-[#1e2128] border border-[#2b2f38] rounded-xl hover:border-[#3d4251] transition-colors flex items-center gap-2"
              >
                <span className="text-sm">가격</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showPriceFilter ? 'rotate-180' : ''}`} />
              </button>
              
              {showPriceFilter && (
                <div className="absolute z-50 mt-2 w-36 bg-[#1e2128] border border-[#2b2f38] rounded-xl shadow-lg overflow-hidden">
                <div className="p-2">
                  {priceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPriceType(option.value);
                        setShowPriceFilter(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg hover:bg-[#2b2f38] ${
                        priceType === option.value ? 'bg-[#2b2f38]' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* 필터 초기화 버튼 */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-[#1e2128] border border-[#2b2f38] rounded-xl hover:border-[#3d4251] transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span className="text-sm">초기화</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {loading ? (
          <div className="col-span-full text-center py-8">로딩중...</div>
        ) : tools.length > 0 ? (
          tools.map((tool) => (
            <ToolCard
              key={tool.id}
              id={tool.id}
              title={tool.title}
              description={tool.description}
              price_type={tool.price_type}
              image_url={tool.image_url}
              categories={tool.categories}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            해당하는 AI 도구가 없습니다.
          </div>
        )}
      </div>

      <div className="fixed right-4 bottom-20 z-50 flex flex-col items-end gap-4">
        {showFabMenu && (
          <>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-base font-medium shadow-lg whitespace-nowrap">
                문의하기
              </span>
              <button
                onClick={() => handleMenuItemClick('contact')}
                className="w-14 h-14 bg-[#3B82F6] rounded-full shadow-lg flex items-center justify-center hover:bg-[#2563EB] transition-colors"
              >
                <ChatBubbleLeftIcon className="w-7 h-7 text-white" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-base font-medium shadow-lg whitespace-nowrap">
                도구 추가요청
              </span>
              <button
                onClick={() => handleMenuItemClick('request')}
                className="w-14 h-14 bg-[#3B82F6] rounded-full shadow-lg flex items-center justify-center hover:bg-[#2563EB] transition-colors"
              >
                <PaperAirplaneIcon className="w-7 h-7 text-white" />
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className="w-14 h-14 bg-[#3B82F6] rounded-full shadow-lg flex items-center justify-center hover:bg-[#2563EB] transition-colors"
        >
          {showFabMenu ? (
            <XMarkIcon className="w-7 h-7 text-white" />
          ) : (
            <PlusIcon className="w-7 h-7 text-white" />
          )}
        </button>
      </div>
    </main>
  );
};

export default Home;
