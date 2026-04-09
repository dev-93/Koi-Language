/**
 * KST(UTC+9) 기준 날짜 문자열 반환
 * @param {string} [dateStr] - 기준 날짜 (없으면 현재)
 * @returns {string} YYYY-MM-DD
 */
export const getKSTDate = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split('T')[0];
};
