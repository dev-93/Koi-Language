import { getSituations } from '@/lib/notion';
import HomeView from '@/components/HomeView';

// ISR: 매 24시간마다 캐시 재생성 (크론잡과 동기화)
export const revalidate = 86400;

export default async function HomePage() {
    const situations = await getSituations();

    return (
        <main>
            <HomeView initialSituations={situations} />
        </main>
    );
}
