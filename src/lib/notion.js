const notionToken = process.env.NOTION_TOKEN;
const situationDbId = process.env.NOTION_SITUATION_DB_ID || process.env.NOTION_SITUATIONS_DB_ID;
const expressionDbId = process.env.NOTION_EXPRESSION_DB_ID || process.env.NOTION_EXPRESSIONS_DB_ID;

const notionRequest = async (path, body) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`https://api.notion.com${path}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${notionToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : null,
            signal: controller.signal,
        });
        const data = await response.json();
        return { status: response.status, body: data };
    } finally {
        clearTimeout(timeout);
    }
};

/**
 * 노션 상황 데이터 조회
 * @returns {Promise<Array>}
 */
export const getSituations = async () => {
    if (!notionToken || !situationDbId) {
        console.error('Missing Notion Configuration', {
            notionToken: !!notionToken,
            situationDbId: !!situationDbId,
        });
        return [];
    }

    try {
        const response = await notionRequest(`/v1/databases/${situationDbId}/query`, {
            sorts: [{ property: 'Date', direction: 'descending' }],
            page_size: 30,
        });

        if (response.status !== 200) {
            console.error('Notion API Error (Situations)', response.body);
            return [];
        }

        return response.body.results.map((page) => {
            const props = page.properties;
            return {
                id: page.id,
                date: props.Date?.date?.start || '',
                title: {
                    kr: props.Title_KR?.title?.[0]?.plain_text || '',
                    jp: props.Title_JP?.rich_text?.[0]?.plain_text || '',
                },
                desc: {
                    kr: props.Desc_KR?.rich_text?.[0]?.plain_text || '',
                    jp: props.Desc_JP?.rich_text?.[0]?.plain_text || '',
                },
                imageUrl: props.URL?.url || props.URL?.rich_text?.[0]?.plain_text || '',
            };
        });
    } catch (error) {
        console.error('getSituations Error:', error);
        return [];
    }
};

/**
 * 노션 오늘의 표현(Expression) 데이터 조회
 * @param {string} situationId
 * @returns {Promise<Array>}
 */
export const getExpressions = async (situationId) => {
    if (!notionToken || !expressionDbId) return [];

    try {
        const response = await notionRequest(`/v1/databases/${expressionDbId}/query`, {
            filter: {
                property: 'Situation',
                relation: { contains: situationId },
            },
        });

        if (response.status !== 200) {
            console.error('Notion API Error (Expressions)', response.body);
            return [];
        }

        return response.body.results.map((page) => {
            const props = page.properties;
            // 노션의 'Name' 또는 'Title' 성격의 첫 컬럼을 한국어(kr)로 사용
            let krText = '';
            const titleProp = Object.values(props).find((p) => p.type === 'title');
            if (titleProp && titleProp.title?.[0]) {
                krText = titleProp.title[0].plain_text;
            } else {
                krText =
                    props.Name?.title?.[0]?.plain_text ||
                    props.KR?.title?.[0]?.plain_text ||
                    props.Title?.title?.[0]?.plain_text ||
                    '';
            }

            // 발음(Reading) 찾기 보강
            const readingProp = Object.entries(props).find(
                ([key, val]) =>
                    ['Pronunciation', '발음', 'Pron', 'Reading'].some((name) =>
                        key.includes(name)
                    ) && val.rich_text
            );
            const readingText = readingProp?.[1]?.rich_text?.[0]?.plain_text || '';

            return {
                id: page.id,
                kr: krText,
                jp:
                    props.Text_JP?.rich_text?.[0]?.plain_text ||
                    props.JP?.rich_text?.[0]?.plain_text ||
                    '',
                reading: readingText,
                tip: props.Tip?.rich_text?.[0]?.plain_text || '',
                target: props.Target?.select?.name || props.Type?.select?.name || props.Type?.multi_select?.[0]?.name || '',
                words: props.Words?.rich_text?.[0]?.plain_text || '', // JSON 형태의 문자열
            };
        });
    } catch (error) {
        console.error('getExpressions Error:', error);
        return [];
    }
};
