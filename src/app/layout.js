import '@/app/globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
    metadataBase: new URL('https://koi-language.vercel.app'),
    title: 'Koi Language - 연애 일본어 마스터',
    description:
        '매일 새로운 일본어 데이트 표현과 팁을 학습하세요. 한일 커플을 위한 최고의 언어 파트너.',
    openGraph: {
        title: 'Koi Language',
        description: '매일 새로운 일본어 데이트 표현과 실전 팁',
        url: 'https://koi-language.vercel.app',
        siteName: 'Koi Language',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'ko_KR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Koi Language',
        description: '연애 일본어 데일리 학습 앱',
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#FF8A8A',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className="antialiased">
                <div id="root">
                    {children}
                    <SpeedInsights />
                </div>
            </body>
        </html>
    );
}
