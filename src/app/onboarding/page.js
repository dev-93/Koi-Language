import OnboardingView from '@/components/OnboardingView';

export const metadata = {
    title: '시작하기 - Koi Language',
    description: 'Koi Language와 함께 연애 일본어 학습을 시작해 보세요.',
};

export default function OnboardingPage() {
    return (
        <main>
            <OnboardingView />
        </main>
    );
}
