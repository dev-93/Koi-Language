import { getSituations, getExpressions } from '@/lib/notion';
import LearnView from '@/components/LearnView';

// ISR: 매 24시간마다 캐시 재생성
export const revalidate = 86400;

export default async function LearnPage({ params }) {
    const { id } = await params;

    const situations = await getSituations();
    const situation = situations.find((s) => s.id === id);
    const expressions = await getExpressions(id);

    if (!situation) {
        return (
            <div className="home-layout justify-center items-center">
                <p className="text-gray-400 font-bold">상황 데이터를 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <main>
            <LearnView situation={situation} initialExpressions={expressions} />
        </main>
    );
}
