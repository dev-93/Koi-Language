import { useState, useEffect } from 'react';

// 로컬 개발 환경에서는 Vite Proxy를 통해 /api/situations로 요청
// 프로덕션(Vercel)에서는 동일 도메인의 /api/situations로 요청
const API_URL = '/api/situations';

const useSituations = () => {
    const [situations, setSituations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSituations = async () => {
            try {
                setLoading(true);
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error(`API 오류: ${res.status}`);
                const data = await res.json();
                setSituations(data.situations ?? []);
            } catch (err) {
                console.error('[useSituations] 데이터 로딩 실패:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSituations();
    }, []);

    return { situations, loading, error };
};

export default useSituations;
