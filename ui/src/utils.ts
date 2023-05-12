export async function queryFetch(
    address: string,
    options: RequestInit = {},
    query: Record<string, string>
) {
    let queryString = ''
    for (const key of Object.keys(query)) {
        queryString += `${key}=${encodeURIComponent(query[key])}&`
    }
    queryString = queryString.slice(0, -1)

    return fetch(
        address + (queryString.length > 0 ? `?${queryString}` : ''),
        options
    )
}
