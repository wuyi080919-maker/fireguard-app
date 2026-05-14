const sites = [
  { name: "北辰广场", type: "商业综合体", owner: "陈工", devices: 1248, risk: "高", next: "明日 09:30" },
  { name: "星河湾一期", type: "住宅小区", owner: "李工", devices: 876, risk: "中", next: "5月16日 14:00" },
  { name: "江岸府", type: "高层住宅", owner: "周工", devices: 642, risk: "低", next: "5月17日 10:00" },
  { name: "创智产业园", type: "园区厂房", owner: "王工", devices: 1584, risk: "高", next: "今日 16:00" },
  { name: "云栖里", type: "社区商业", owner: "赵工", devices: 438, risk: "中", next: "5月18日 11:00" }
];

const alerts = [
  { level: "high", title: "北辰广场 2 号报警主机离线", meta: "持续 42 分钟 · 已通知陈工" },
  { level: "high", title: "创智园 B3 喷淋压力低", meta: "低于阈值 18% · 待现场复核" },
  { level: "medium", title: "星河湾 6 栋安全出口堵塞", meta: "物业已接单 · 预计 17:30 完成" },
  { level: "low", title: "江岸府灭火器即将到期", meta: "剩余 12 天 · 自动生成更换计划" }
];

const ticketStorageKey = "fireguard.tickets.v1";
const githubConfigKey = "fireguard.github.config.v1";
const worklogStorageKey = "fireguard.worklog.v1";

const defaultTickets = [
  { status: "pending", site: "北辰广场", task: "报警主机通讯恢复复检", assignee: "陈工", due: "今日 15:00" },
  { status: "pending", site: "云栖里", task: "消防通道占用核查", assignee: "赵工", due: "明日 10:00" },
  { status: "doing", site: "创智产业园", task: "水泵房联动测试", assignee: "王工", due: "今日 16:00" },
  { status: "doing", site: "星河湾一期", task: "月度维保巡检", assignee: "李工", due: "5月16日" },
  { status: "done", site: "江岸府", task: "末端试水装置检查", assignee: "周工", due: "已完成" }
];

let tickets = loadTickets();
let githubFileSha = "";
let worklog = loadWorklog();

const devices = [
  { name: "火灾报警主机", count: 126, health: 93, state: "12 台需维护" },
  { name: "消防水泵", count: 84, health: 88, state: "3 台压力异常" },
  { name: "喷淋末端", count: 2160, health: 97, state: "运行稳定" },
  { name: "烟感探测器", count: 18420, health: 96, state: "72 个离线" },
  { name: "防火卷帘", count: 328, health: 91, state: "18 个待复位" },
  { name: "灭火器", count: 9610, health: 86, state: "238 个临期" }
];

const risks = [
  { date: "今日 11:20", title: "创智园 B3 区喷淋压力异常", desc: "维保工程师已到场，初判为稳压泵启停参数漂移。", state: "处理中", level: "high" },
  { date: "昨日 18:05", title: "星河湾 6 栋安全出口堵塞", desc: "物业完成清障并上传照片，等待复检确认。", state: "待复检", level: "medium" },
  { date: "5月12日", title: "北辰广场消防控制室值班记录缺失", desc: "已补录排班和交接记录，纳入月度培训清单。", state: "已关闭", level: "low" }
];

const titles = {
  dashboard: "项目总览",
  sites: "楼宇小区",
  inspections: "巡检工单",
  devices: "设备台账",
  risks: "隐患闭环",
  worklog: "工作信息"
};

const riskClass = (risk) => (risk === "高" ? "high" : risk === "中" ? "medium" : "low");

function loadTickets() {
  try {
    const savedTickets = JSON.parse(localStorage.getItem(ticketStorageKey));
    return Array.isArray(savedTickets) ? savedTickets : defaultTickets;
  } catch {
    return defaultTickets;
  }
}

function saveTickets() {
  localStorage.setItem(ticketStorageKey, JSON.stringify(tickets));
}

function loadWorklog() {
  try {
    const savedRecords = JSON.parse(localStorage.getItem(worklogStorageKey));
    return Array.isArray(savedRecords) ? savedRecords : [];
  } catch {
    return [];
  }
}

function saveWorklog() {
  localStorage.setItem(worklogStorageKey, JSON.stringify(worklog));
}

function loadGithubConfig() {
  try {
    return JSON.parse(localStorage.getItem(githubConfigKey)) || {};
  } catch {
    return {};
  }
}

function saveGithubConfig(config) {
  localStorage.setItem(githubConfigKey, JSON.stringify(config));
}

function utf8ToBase64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function base64ToUtf8(value) {
  return decodeURIComponent(escape(atob(value.replace(/\n/g, ""))));
}

function getGithubConfig() {
  return {
    owner: document.querySelector("#github-owner").value.trim(),
    repo: document.querySelector("#github-repo").value.trim(),
    path: document.querySelector("#github-path").value.trim() || "data/worklog.json",
    branch: document.querySelector("#github-branch").value.trim() || "main",
    token: document.querySelector("#github-token").value.trim()
  };
}

function setGithubState(text, level = "low") {
  const state = document.querySelector("#github-state");
  state.textContent = text;
  state.className = `badge ${level}`;
}

function renderAlerts() {
  document.querySelector("#alert-list").innerHTML = alerts
    .map((alert) => `
      <article class="alert">
        <span class="badge ${alert.level}">${alert.level === "high" ? "紧急" : alert.level === "medium" ? "关注" : "提醒"}</span>
        <strong>${alert.title}</strong>
        <small>${alert.meta}</small>
      </article>
    `)
    .join("");
}

function renderSites(items = sites) {
  document.querySelector("#site-table").innerHTML = items
    .map((site) => `
      <tr>
        <td><strong>${site.name}</strong></td>
        <td>${site.type}</td>
        <td>${site.owner}</td>
        <td>${site.devices.toLocaleString()}</td>
        <td><span class="badge ${riskClass(site.risk)}">${site.risk}风险</span></td>
        <td>${site.next}</td>
      </tr>
    `)
    .join("");
}

function renderTickets(filter = "all") {
  const columns = [
    { key: "pending", title: "待处理" },
    { key: "doing", title: "进行中" },
    { key: "done", title: "已完成" }
  ];

  document.querySelector("#ticket-board").innerHTML = columns
    .map((column) => {
      const cards = tickets
        .filter((ticket) => ticket.status === column.key)
        .filter((ticket) => filter === "all" || ticket.status === filter)
        .map((ticket) => `
          <article class="ticket">
            <span class="badge ${column.key === "pending" ? "high" : column.key === "doing" ? "medium" : "low"}">${ticket.due}</span>
            <h3>${ticket.site}</h3>
            <strong>${ticket.task}</strong>
            <p>负责人：${ticket.assignee}</p>
          </article>
        `)
        .join("");
      return `<section class="kanban-col"><h3>${column.title}</h3>${cards || "<p>暂无工单</p>"}</section>`;
    })
    .join("");
}

function renderDevices() {
  document.querySelector("#device-grid").innerHTML = devices
    .map((device) => `
      <article class="device">
        <div class="device-top">
          <div>
            <strong>${device.name}</strong>
            <p>${device.count.toLocaleString()} 个/台</p>
          </div>
          <span class="badge ${device.health >= 95 ? "low" : device.health >= 90 ? "medium" : "high"}">${device.health}%</span>
        </div>
        <div class="meter"><span style="--value: ${device.health}%"></span></div>
        <p>${device.state}</p>
      </article>
    `)
    .join("");
}

function renderRisks() {
  document.querySelector("#risk-timeline").innerHTML = risks
    .map((risk) => `
      <article class="risk-step">
        <div class="risk-date">${risk.date}</div>
        <div>
          <strong>${risk.title}</strong>
          <p>${risk.desc}</p>
        </div>
        <span class="badge ${risk.level}">${risk.state}</span>
      </article>
    `)
    .join("");
}

function renderWorklog() {
  document.querySelector("#worklog-list").innerHTML = worklog.length
    ? worklog
        .map((record) => `
          <article class="record-card">
            <div class="record-meta">
              <strong>${record.project}</strong><br />
              ${record.createdAt}
            </div>
            <div>
              <span class="badge medium">${record.type}</span>
              <p>${record.content}</p>
            </div>
            <button class="ghost-btn" data-delete-record="${record.id}">删除</button>
          </article>
        `)
        .join("")
    : `<article class="record-card"><div class="record-meta">暂无记录</div><div><p>添加第一条工作信息后，可以同步到 GitHub。</p></div></article>`;

  document.querySelectorAll("[data-delete-record]").forEach((button) => {
    button.addEventListener("click", () => {
      worklog = worklog.filter((record) => record.id !== button.dataset.deleteRecord);
      saveWorklog();
      renderWorklog();
    });
  });
}

function hydrateGithubForm() {
  const config = loadGithubConfig();
  document.querySelector("#github-owner").value = config.owner || "";
  document.querySelector("#github-repo").value = config.repo || "";
  document.querySelector("#github-path").value = config.path || "data/worklog.json";
  document.querySelector("#github-branch").value = config.branch || "main";
  document.querySelector("#github-token").value = config.token || "";
  setGithubState(config.owner && config.repo && config.token ? "已保存" : "未连接", config.token ? "medium" : "low");
}

function requireGithubConfig() {
  const config = getGithubConfig();
  if (!config.owner || !config.repo || !config.token) {
    setGithubState("缺少配置", "high");
    throw new Error("请先填写 GitHub 用户名、仓库名和 Token。");
  }
  return config;
}

async function pullFromGithub() {
  const config = requireGithubConfig();
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
  setGithubState("读取中", "medium");

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (response.status === 404) {
    githubFileSha = "";
    worklog = [];
    saveWorklog();
    renderWorklog();
    setGithubState("新文件", "medium");
    return;
  }

  if (!response.ok) {
    throw new Error(`GitHub 读取失败：${response.status}`);
  }

  const file = await response.json();
  githubFileSha = file.sha;
  const data = JSON.parse(base64ToUtf8(file.content));
  worklog = Array.isArray(data.records) ? data.records : [];
  saveWorklog();
  renderWorklog();
  setGithubState("已读取", "low");
}

async function pushToGithub() {
  const config = requireGithubConfig();
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
  const body = {
    message: `Update fireguard worklog ${new Date().toLocaleString("zh-CN")}`,
    content: utf8ToBase64(JSON.stringify({ records: worklog }, null, 2)),
    branch: config.branch
  };

  if (githubFileSha) {
    body.sha = githubFileSha;
  }

  setGithubState("保存中", "medium");
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify(body)
  });

  if (response.status === 409 || response.status === 422) {
    await pullFromGithub();
    throw new Error("GitHub 文件已变化，请检查读取后的记录，再保存一次。");
  }

  if (!response.ok) {
    throw new Error(`GitHub 保存失败：${response.status}`);
  }

  const result = await response.json();
  githubFileSha = result.content.sha;
  setGithubState("已保存", "low");
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.id === view));
    document.querySelector("#page-title").textContent = titles[view];
  });
});

document.querySelectorAll(".chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    renderTickets(button.dataset.filter);
  });
});

document.querySelector("#search-input").addEventListener("input", (event) => {
  const keyword = event.target.value.trim().toLowerCase();
  const filteredSites = sites.filter((site) =>
    [site.name, site.type, site.owner, site.risk].some((value) => value.toLowerCase().includes(keyword))
  );
  renderSites(filteredSites);
});

document.querySelector("#new-ticket-btn").addEventListener("click", () => {
  document.querySelector("#ticket-dialog").showModal();
});

document.querySelector("#close-ticket-dialog").addEventListener("click", () => {
  document.querySelector("#ticket-dialog").close();
});

document.querySelector("#cancel-ticket").addEventListener("click", () => {
  document.querySelector("#ticket-dialog").close();
});

document.querySelector("#ticket-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const ticket = {
    status: "pending",
    site: document.querySelector("#ticket-site").value.trim(),
    task: document.querySelector("#ticket-type").value,
    assignee: document.querySelector("#ticket-assignee").value.trim(),
    due: document.querySelector("#ticket-due").value.trim(),
    desc: document.querySelector("#ticket-desc").value.trim()
  };

  tickets = [ticket, ...tickets];
  saveTickets();
  renderTickets(document.querySelector(".chip.active")?.dataset.filter || "all");
  document.querySelector("#ticket-dialog").close();
});

document.querySelector("#github-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const config = getGithubConfig();
  saveGithubConfig(config);
  setGithubState("已保存", "medium");
});

document.querySelector("#worklog-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const record = {
    id: crypto.randomUUID(),
    project: document.querySelector("#work-project").value.trim(),
    type: document.querySelector("#work-type").value,
    content: document.querySelector("#work-content").value.trim(),
    createdAt: new Date().toLocaleString("zh-CN")
  };

  worklog = [record, ...worklog];
  saveWorklog();
  renderWorklog();
  document.querySelector("#work-content").value = "";
});

document.querySelector("#pull-github").addEventListener("click", async () => {
  try {
    await pullFromGithub();
  } catch (error) {
    setGithubState("读取失败", "high");
    alert(error.message);
  }
});

document.querySelector("#push-github").addEventListener("click", async () => {
  try {
    await pushToGithub();
  } catch (error) {
    setGithubState("保存失败", "high");
    alert(error.message);
  }
});

document.querySelector("#clear-local-worklog").addEventListener("click", () => {
  if (!confirm("只清空当前浏览器里的工作信息，不会删除 GitHub 文件。")) return;
  worklog = [];
  saveWorklog();
  renderWorklog();
});

renderAlerts();
renderSites();
renderTickets();
renderDevices();
renderRisks();
hydrateGithubForm();
renderWorklog();
