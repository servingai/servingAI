import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';

const ToolDetail = () => {
  const { id } = useParams();
  const [tool, setTool] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchToolDetails();
    fetchReviews();
  }, [id]);

  const fetchToolDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select(`
          *,
          tool_categories (
            categories (
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching tool details:', error);
        throw error;
      }
      
      console.log('Tool details:', data); // 디버깅용 로그
      setTool(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id (
            email,
            name,
            avatar_url
          )
        `)
        .eq('tool_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderPlaceholder = () => {
    return (
      <div className="w-full h-full bg-[#1e2128] flex items-center justify-center">
        <div className="text-5xl font-bold text-gray-600">
          {tool?.title ? tool.title.charAt(0).toUpperCase() : 'AI'}
        </div>
      </div>
    );
  };

  const getPriceTypeLabel = (type) => {
    switch (type) {
      case 'free':
        return '무료';
      case 'paid':
        return '유료';
      case 'free_trial':
        return '무료체험';
      default:
        return type;
    }
  };

  const getPriceTypeColor = (type) => {
    switch (type) {
      case 'free':
        return 'bg-green-500/20 text-green-500';
      case 'paid':
        return 'bg-red-500/20 text-red-500';
      case 'free_trial':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (!tool) return <div className="pt-[60px] text-center">로딩중...</div>;

  return (
    <main className="pt-[60px] pb-[80px] px-4 max-w-4xl mx-auto">
      {/* Tool Header */}
      <div className="bg-[#1e2128] rounded-xl overflow-hidden mb-6 border border-[#2b2f38]">
        <div className="relative aspect-[2/1] bg-white">
          {tool.image_url && !imageError ? (
            <div className="w-full h-full flex items-center justify-center p-12">
              <img
                src={tool.image_url}
                alt={tool.title}
                className="max-w-[400px] w-full h-full object-contain"
                onError={handleImageError}
              />
            </div>
          ) : (
            renderPlaceholder()
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {tool.tool_categories?.map((tc) => (
              <span 
                key={tc.categories?.name || tc.id}
                className="text-sm bg-[#2b2f38] text-gray-300 px-3 py-1.5 rounded-full"
              >
                {tc.categories?.name}
              </span>
            ))}
            <span className={`text-sm px-3 py-1.5 rounded-full ${getPriceTypeColor(tool.price_type)}`}>
              {getPriceTypeLabel(tool.price_type)}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-4">{tool.title}</h1>
          <p className="text-gray-400 mt-3 leading-relaxed">{tool.description}</p>
          {tool.website_url && tool.website_url !== '' && (
            <a
              href={tool.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              웹사이트 방문하기
            </a>
          )}
        </div>
      </div>

      {/* Tool Features */}
      <div className="bg-[#1e2128] rounded-xl p-6 mb-6 border border-[#2b2f38]">
        <h2 className="text-lg font-bold mb-4">주요 기능</h2>
        <ul className="space-y-3">
          {tool.features?.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <i className="fas fa-check-circle text-green-500 mt-1"></i>
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reviews Section */}
      <div className="bg-[#1e2128] rounded-xl p-6 border border-[#2b2f38]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">리뷰</h2>
          <button className="bg-[#2b2f38] hover:bg-[#3d4251] px-4 py-2 rounded-lg text-sm transition-colors">
            리뷰 작성
          </button>
        </div>
        
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-[#2b2f38] pt-6">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={review.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user.name)}&background=2b2f38&color=fff`}
                  alt={review.user.name}
                  className="w-10 h-10 rounded-full bg-[#2b2f38]"
                />
                <div>
                  <p className="font-medium">{review.user.name}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-300">{review.content}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default ToolDetail;
