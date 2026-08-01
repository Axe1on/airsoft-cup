/* АВТОНОМНЫЙ ДРАЙВЕР ДЛЯ СВЯЗИ С ОБЛАКОМ SUPABASE */
window.supabase = {
    createClient: function(url, key) {
        const headers = {
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };

        return {
            from: function(tableName) {
                const tableUrl = url + '/rest/v1/' + tableName;

                /* Объект-запрос, который умеет накапливать методы (select, order и т.д.) */
                const requestBuilder = {
                    url: tableUrl,
                    method: 'GET',
                    body: null,
                    headers: { ...headers },
                    
                    select: function() {
                        this.method = 'GET';
                        return this;
                    },
                    order: function() {
                        /* Метод order просто возвращает этот же объект, fetch заберет данные */
                        return this;
                    },
                    /* Метод then превращает объект в аналог Promise, чтобы работал await */
                    then: async function(onFulfilled) {
                        try {
                            const res = await fetch(this.url, {
                                method: this.method,
                                headers: this.headers,
                                body: this.body
                            });
                            if (!res.ok) throw new Error('HTTP ' + res.status);
                            const data = await res.json();
                            onFulfilled({ data: data, error: null });
                        } catch (err) {
                            onFulfilled({ data: null, error: err });
                        }
                    }
                };

                return {
                    select: function() {
                        return requestBuilder.select();
                    },
                    insert: async function(rows) {
                        try {
                            const res = await fetch(tableUrl, {
                                method: 'POST',
                                headers: headers,
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
                    }
                };
            }
        };
    }
};
