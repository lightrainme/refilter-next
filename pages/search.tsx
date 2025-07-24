// pages/search.tsx
import { useState } from 'react';
import axios from 'axios';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      console.log('응답 데이터:', response.data);
      const resultData = response.data.data;
      const productList = resultData.productData;

      if(Array.isArray(productList)){
        setResults(productList);
      } else {
        console.log('결과가 배열이 아닙니다', productList);
        setResults([]);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">상품 검색</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어를 입력하세요"
          className="flex-1 border px-4 py-2 rounded-md"
        />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded-md">
          검색
        </button>
      </div>
      {loading ? (
        <p>검색 중...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {results.map((item, idx) => (
            <a
              key={idx}
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-4 hover:shadow-md"
            >
              <img src={item.productImage} alt={item.productName} className="w-full h-48 object-cover mb-2" />
              <h2 className="text-lg font-medium">{item.productName}</h2>
              <p className="text-gray-600">₩{item.productPrice.toLocaleString()}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}