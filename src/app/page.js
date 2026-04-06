import { getSituations } from '@/lib/notion';
import HomeView from '@/components/HomeView';

// ISR: 매 1시간마다 캐시 재생성 (크론잡 후 데이터가 즉시 보이지 않을 수 있으므로 짧게 조정)
export const revalidate = 3600;

export default async function HomePage() {
    const situations = await getSituations();

    return (
        <main>
            <HomeView initialSituations={situations} />
        </main>
    );
}
