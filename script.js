const API = (function(){
    if (!localStorage.getItem("budget")) {
        localStorage.setItem("budget", JSON.stringify([[], [], []]))
    }
    storage = JSON.parse(localStorage.getItem("budget"))
    console.log(storage)
    return {
        transactions: {
            all(filter) {
                if (filter === "this-week") {
                    current = new Date((new Date()).setHours(0, 0, 0))
                    range = [
                        (new Date(current.setDate(current.getDate() - current.getDay()))).getTime(),
                        (new Date(current.setDate(current.getDate() - current.getDay() + 6))).getTime()
                    ]
                    filtered = storage[0].filter((transaction) => (transaction[0] > range[0] && transaction[0] < range[1]))
                } else if (filter === "max") {
                    filtered = storage[0]
                }
                data = [0, 0, 0]
                filtered.forEach((transaction) => {
                    if (transaction[2] < 0) data[1] += transaction[2] * -1
                    if (transaction[2] > 0) data[0] += transaction[2]
                })
                return [filtered, {
                    type: filter,
                    income: data[0], expense: data[1], balance: data[0] - data[1]
                }]
            },
            create(name, amount, category) {
                if (amount < 0 && category) {
                    storage[0].push([Date.now(), name, amount, category])
                } else {
                    storage[0].push([Date.now(), name, amount])
                }
                localStorage.setItem("budget", JSON.stringify(storage))
                return storage[0][storage[0].length-1]
            },
            delete(id) {
                storage[0].splice(storage[0].indexOf(storage[0].filter((transaction) => (transaction[0] === id))), 1)
                localStorage.setItem("budget", JSON.stringify(storage))
            }
        },
        categories: {
            all() {
                return storage[1]
            },
            create(name, budget, color) {
                id = btoa(name + budget).replace(/[^a-zA-Z0-9]/g, '').slice(-10)
                if (storage[1].filter((category) => (category[0] === id)).length < 1) {
                    storage[1].push([id, name, budget, color])
                    localStorage.setItem("budget", JSON.stringify(storage))
                    return storage[1][storage[1].length-1]
                } else {
                    return null
                }
            },
            delete(id) {
                storage[1].splice(storage[1].indexOf(storage[1].filter((category) => (category[0] === id))), 1)
                localStorage.setItem("budget", JSON.stringify(storage))
            }
        },
        goals: {
            all() {
                if (storage[2].filter((goal) => (goal[3] === true)).length > 0) {
                    priority = storage[2].splice(storage[2].indexOf(storage[2].filter((goal) => (goal[3] === true)).pop()), 1)
                    storage[2] = priority.concat(storage[2].sort(function(a, b){return b[2]-a[2]}))
                } else {
                    storage[2] = storage[2].sort(function(a, b){return b[2]-a[2]})
                }
                return storage[2]
            },
            create(name, amount, priority=false) {
                id = btoa(name + amount).replace(/[^a-zA-Z0-9]/g, '').slice(-10)
                if (storage[2].filter((goal) => (goal[0] === id)).length < 1) {
                    if (priority) {
                        storage[2] = storage[2].map((goal) => ([goal[0], goal[1], goal[2], false]))
                    }
                    storage[2].push([id, name, amount, priority])
                    localStorage.setItem("budget", JSON.stringify(storage))
                    return storage[2][storage[2].length-1]
                } else {
                    return null
                }
            },
            delete(id) {
                storage[2].splice(storage[2].indexOf(storage[2].filter((goal) => (goal[0] === id))), 1)
                localStorage.setItem("budget", JSON.stringify(storage))
            }
        },
        reset() {
            localStorage.removeItem("budget")
            window.location.reload()
        },
        overview() {
            elements = {
                overview: {
                    time: document.getElementById("overview-time"),
                    balance: document.getElementById("overview-balance"),
                    filter: document.getElementById("overview-filter"),
                    progress: document.getElementById("overview-progress"),
                    legend: document.getElementById("overview-legend")
                },
                glance: {
                    balance: document.getElementById("glance-balance")
                },
                transactions: document.getElementById("transactions-list"),
                goals: document.getElementById("goals-list")
            }
            max = this.transactions.all("max")
            categories = this.categories.all()
            goals = [categories.filter((category) => (category[1].toLowerCase() === "goals")).pop(), this.goals.all(), {}]
            overview = [this.transactions.all(elements.overview.filter.value), {}]
            elements.overview.time.textContent = ({
                "this-week": "This Week"
            })[overview[0][1].type]
            elements.glance.balance.textContent = `$${max[1].balance.toFixed(2)}`
            elements.overview.balance.textContent = `$${overview[0][1].balance.toFixed(2)} left`
            overview[0][0].filter((transaction) => (transaction[2] < 0 && transaction[3])).forEach((transaction) => {
                if (!overview[1][transaction[3]]) overview[1][transaction[3]] = [categories.filter((category) => (category[0] === transaction[3])).pop(), 0]
                overview[1][transaction[3]][1] += transaction[2] * -1
                if (transaction[3] !== goals[0][0]) {
                    transaction = [transaction, document.createElement("li")]
                    transaction[1].style.border = "1px solid " + overview[1][transaction[0][3]][0][3]
                    transaction[1].innerHTML = `
                        <div class="info">
                            <div>
                                <h1>${transaction[0][1]}</h1>
                                <span>${overview[1][transaction[0][3]][0][1]}</span>
                            </div>
                        </div>
                        <h1 class="amount">-$${(transaction[0][2] * -1).toFixed(2)}</h1>
                    `
                    elements.transactions.appendChild(transaction[1])
                }
            })
            max[0].filter((transaction) => (
                transaction[2] < 0 && transaction[3] && transaction[3] === goals[0][0]
            )).forEach((transaction) => {
                if (!goals[2][transaction[1]]) goals[2][transaction[1]] = 0
                goals[2][transaction[1]] += transaction[2] * -1
            })
            Object.entries(overview[1]).sort(function(a,b){return b[1][1]-a[1][1]}).forEach((category) => {
                category = [category[1], document.createElement("div"), document.createElement("li")]
                category[1].style.width = (category[0][1]/max[1].income) * 100 + "%"
                category[1].style.backgroundColor = `${category[0][0][3]}`
                category[2].innerHTML = `<div style="background-color: ${category[0][0][3]}"></div>${category[0][0][1]}`
                elements.overview.legend.appendChild(category[2])
                elements.overview.progress.appendChild(category[1])
            })
            goals[1].forEach((goal) => {
                goal = [goal, goals[2][goal[0]] ? goals[2][goal[0]] : 0, document.createElement("li")]
                console.log(goal)
                goal[2].innerHTML = `
                    <div class="info" style="position: relative">
                        <div style="position: absolute; top: 0; left: 0; bottom: 0; display: flex; align-items: center">
                            <div>
                                <h1>${goal[0][1]}</h1>
                                <span>$${goal[1].toFixed(2)} of $${goal[0][2].toFixed(2)}</span>
                            </div>
                        </div>
                        <h1 class="percent">${((goal[1]/goal[0][2])*100).toFixed(2)}%</h1>
                    </div>
                    <div class="progress">
                        <div style="width: ${(goal[1]/goal[0][2])*100}%; height: 100%; border-radius: 5px; background-color: #9B59B6"></div>
                    </div>
                `
                elements.goals.appendChild(goal[2])
            })
        },
        init() {
            this.categories.create("Food", 0.45, "#3498db")
            this.categories.create("Tithe & Offerings", 0.1, "#e67e22")
            this.categories.create("Transport", 0.1, "#2ecc71")
            this.categories.create("Goals", 0.2, "#9b59b6")
            this.categories.create("Miscellaneous", 0.15, "#222222")
        }
    }
})()
API.overview()