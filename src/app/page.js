import { getSituations } from '@/lib/notion';
import HomeView from '@/components/HomeView';

/**
 * Next.js 서버 컴포넌트
 * 빌드 타임 혹은 요청 시점에 서버에서 데이터를 미리 가져옵니다.
 */
export default async function HomePage() {
    // 1. 서버에서 노션 상황 데이터 가져오기
    const situations = await getSituations();
    
    // 2. 만약 데이터가 없다면 빈 배열 전달
    // (이때 클라이언트 하이드레이션 전에 이미 HTML로 렌더링되므로 SEO에 유리함)
    return (
        <main>
            <HomeView initialSituations={situations} />
        </main>
    );
}
