export async function queryFetch(
    address: string,
    options: RequestInit = {},
    queries: Record<string, string | string[] | number>
) {
    const stringifiedQueries = []
    for (const key of Object.keys(queries)) {
        const value = queries[key]
        if (Array.isArray(value)) {
            for (const e of value) {
                stringifiedQueries.push(
                    `${encodeURIComponent(key)}[]=${encodeURIComponent(e)}`
                )
            }
        } else {
            stringifiedQueries.push(
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            )
        }
    }
    let queryString = stringifiedQueries.join('&')
    if (queryString.length > 0) queryString = '?' + queryString

    return fetch(`${address}${queryString}`, options)
}
