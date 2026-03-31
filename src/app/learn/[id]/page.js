import { getSituations, getExpressions } from '@/lib/notion';
import LearnView from '@/components/LearnView';

export default async function LearnPage({ params }) {
    const { id } = await params;
    
    // 1. 서버에서 모든 상황 리스트 가져오기 (현재 상황 정보를 찾기 위해)
    const situations = await getSituations();
    const situation = situations.find(s => s.id === id);
    
    // 2. 해당 상황에 속한 모든 학습 표현들 가져오기
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
            <LearnView 
                situation={situation} 
                initialExpressions={expressions} 
            />
        </main>
    );
}
