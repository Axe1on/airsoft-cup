/* АВТОНОМНЫЙ ДРАЙВЕР ДЛЯ СВЯЗИ С ОБЛАКОМ SUPABASE */
window.supabase = {
    createClient: function(url, key) {
        const headers = {
            'apiKey': key,
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json'
        };

        return {
            from: function(tableName) {
                const tableUrl = url + '/rest/v1/' + tableName;

                return {
                    select: async function() {
                        try {
                            const res = await fetch(tableUrl + '?select=*', { method: 'GET', headers: headers });
                            if (!res.ok) throw new Error('HTTP ' + res.status);
                            const data = await res.json();
                            return { data: data, error: null };
                        } catch (err) {
                            return { data: null, error: err };
                        }
                    },
                    insert: async function(rows) {
                        try {
                            const res = await fetch(tableUrl, {
                                method: 'POST',
                                headers: { ...headers, 'Prefer': 'return=representation' },
                                body: JSON.stringify(rows)
                            });
                            if (!res.ok) throw new Error('HTTP ' + res.status);
                            return { error: null };
                        } catch (err) {
                            return { error: err };
                        }
                    },
                    update: function(values) {
                        return {
                            eq: async function(column, value) {
                                try {
                                    const res = await fetch(tableUrl + '?' + column + '=eq.' + encodeURIComponent(value), {
                                        method: 'PATCH',
                                        headers: headers,
                                        body: JSON.stringify(values)
                                    });
                                    if (!res.ok) throw new Error('HTTP ' + res.status);
                                    return { error: null };
                                } catch (err) {
                                    return { error: err };
                                }
                            }
                        };
                    },
                    delete: function() {
                        return {
                            eq: async function(column, value) {
                                try {
                                    const res = await fetch(tableUrl + '?' + column + '=eq.' + encodeURIComponent(value), {
                                        method: 'DELETE',
                                        headers: headers
                                    });
                                    if (!res.ok) throw new Error('HTTP ' + res.status);
                                    return { error: null };
                                } catch (err) {
                                    return { error: err };
                                }
                            }
                        };
                    },
                    order: function() {
                        return this; /* Заглушка для сортировки, fetch забирает данные и так */
                    }
                };
            }
        };
    }
};
