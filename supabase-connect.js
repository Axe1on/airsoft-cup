/* АВТОНОМНЫЙ ДРАЙВЕР ДЛЯ СВЯЗИ С ОБЛАКОМ SUPABASE */
window.supabase = {
    createClient: function(url, key) {
        return {
            from: function(tableName) {
                const tableUrl = url + '/rest/v1/' + tableName;

                /* Объект-конструктор для безопасного сбора цепочки методов (select, order) */
                const requestBuilder = {
                    url: tableUrl,
                    // Запоминаем параметры, но возвращаем этот же объект для сохранения цепочки
                    select: function() { return this; },
                    order: function(column, options) { 
                        // Добавляем поддержку сортировки в URL PostgREST API
                        const direction = (options && options.ascending === false) ? 'desc' : 'asc';
                        this.url += (this.url.includes('?') ? '&' : '?') + 'order=' + column + '.' + direction;
                        return this; 
                    },
                    
                    /* Метод then перехватывает await и делает реальный GET запрос */
                    then: async function(onFulfilled) {
                        try {
                            // Формируем чистый итоговый URL с учетом добавленных параметров сортировки
                            let finalUrl = this.url;
                            if (!finalUrl.includes('select=')) {
                                finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'select=*';
                            }
                            
                            const res = await fetch(finalUrl, {
                                method: 'GET',
                                headers: {
                                    'apikey': key,
                                    'Authorization': 'Bearer ' + key
                                }
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
                                headers: {
                                    'apikey': key,
                                    'Authorization': 'Bearer ' + key,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=representation'
                                },
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
                                        headers: {
                                            'apikey': key,
                                            'Authorization': 'Bearer ' + key,
                                            'Content-Type': 'application/json'
                                        },
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
                        /* Возвращаем объект со всеми методами фильтрации удаления для script.js */
                        return {
                            url: tableUrl,
                            /* Метод фильтрации "равно" (например, удалить конкретного игрока по имени) */
                            eq: async function(column, value) {
                                try {
                                    const res = await fetch(this.url + '?' + column + '=eq.' + encodeURIComponent(value), {
                                        method: 'DELETE',
                                        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
                                    });
                                    if (!res.ok) throw new Error('HTTP ' + res.status);
                                    return { error: null };
                                } catch (err) {
                                    return { error: err };
                                }
                            },
                            /* Метод фильтрации "не равно" (используется при очистке истории матчей) */
                            neq: async function(column, value) {
                                try {
                                    /* В REST API Supabase оператор не равно пишется как neq */
                                    const res = await fetch(this.url + '?' + column + '=neq.' + encodeURIComponent(value), {
                                        method: 'DELETE',
                                        headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
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
