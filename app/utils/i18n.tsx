import { createContext, useContext, useMemo, type ReactNode } from "react";

import { uiMessages } from "./ui-messages";

export const localeCookie = "hsc_locale";

export type Locale = "en" | "zh-CN";

const messages = {
  "meta.title": ["Headplane", "Headplane 控制台"],
  "meta.description": [
    "A frontend for the headscale coordination server",
    "Headscale 协调服务器的 Web 管理界面",
  ],
  "language.english": ["English", "English"],
  "language.chinese": ["中文", "中文"],
  "language.label": ["Language", "语言"],
  "nav.machines": ["Machines", "设备"],
  "home.network": ["Manage network address pool", "管理网络地址池"],
  "nav.users": ["Users", "用户"],
  "nav.acls": ["Access controls", "访问控制"],
  "nav.dns": ["DNS", "DNS"],
  "nav.network": ["Network", "网络"],
  "nav.settings": ["Settings", "设置"],
  "nav.navigation": ["Navigation", "导航"],
  "nav.help": ["Help", "帮助"],
  "nav.docs": ["Docs", "文档"],
  "nav.headscale": ["Headscale", "Headscale"],
  "nav.download": ["Download", "下载"],
  "nav.apiKey": ["API key", "API 密钥"],
  "nav.accountCenter": ["My account", "我的账号"],
  "nav.platformAccounts": ["Registered accounts", "注册账号管理"],
  "nav.logout": ["Log out", "退出登录"],
  "color.system": ["System", "跟随系统"],
  "color.light": ["Light", "浅色"],
  "color.dark": ["Dark", "深色"],
  "app.headscaleUnreachable.title": ["Can't reach Headscale", "无法连接 Headscale"],
  "app.headscaleUnreachable.body": [
    "Some data may be out of date, and changes won't save until it's back.",
    "部分数据可能已过期，在 Headscale 恢复前更改将无法保存。",
  ],
  "app.loading": ["Loading…", "加载中…"],
  "footer.before": [
    "Headplane is free and open-source. Please consider ",
    "Headplane 是免费开源软件，欢迎",
  ],
  "footer.sponsor": ["sponsoring", "赞助"],
  "footer.after": [" to support development.", "以支持项目开发。"],
  "footer.debug": ["Debug", "调试"],
  "footer.hideUrl": ["Hide server URL", "隐藏服务器地址"],
  "footer.showUrl": ["Show server URL", "显示服务器地址"],
  "error.tryAgain": ["Try again", "重试"],
  "error.goHeadplane": ["Go to Headplane", "前往 Headplane"],
  "error.details": ["Details", "详细信息"],
  "error.report": ["Report an issue", "报告问题"],
  "error.signInAgain": ["Sign in again", "重新登录"],
  "error.page.thisPage": ["this page", "此页面"],
  "error.page.machines": ["machines", "设备"],
  "error.page.users": ["users", "用户"],
  "error.page.dns": ["DNS settings", "DNS 设置"],
  "error.page.acls": ["the access control policy", "访问控制策略"],
  "error.page.authKeys": ["auth keys", "认证密钥"],
  "error.page.settings": ["settings", "设置"],
  "error.page.machine": ["this machine", "此设备"],
  "error.cantLoad": ["Can't load {page}", "无法加载{page}"],
  "error.forbidden": ["You don't have access to {page}", "你没有访问{page}的权限"],
  "error.connection.body": [
    "This page needs Headscale to load. Try again once it's back.",
    "此页面需要 Headscale 才能加载，请在恢复后重试。",
  ],
  "error.notFound.title": ["Page not found", "页面不存在"],
  "error.notFound.body": [
    "The page you're looking for doesn't exist or has moved.",
    "你访问的页面不存在或已移动。",
  ],
  "error.forbidden.title": ["Access denied", "访问被拒绝"],
  "error.forbidden.body": [
    "You don't have permission to view this page.",
    "你没有查看此页面的权限。",
  ],
  "error.headscale.title": ["Headscale returned an error", "Headscale 返回错误"],
  "error.unknown.title": ["Something went wrong", "出现错误"],
  "error.unknown.body": [
    "An unexpected error occurred. Try again or check the server logs.",
    "发生意外错误，请重试或检查服务器日志。",
  ],
  "auth.signIn": ["Sign in to Headplane", "登录 Headplane"],
  "auth.signInOidc": ["Sign in with single sign-on", "使用单点登录"],
  "auth.or": ["or", "或"],
  "auth.apiKey": ["API key", "API 密钥"],
  "auth.apiKeyHelp.before": ["Create one by running ", "在 Headscale 服务器上运行 "],
  "auth.apiKeyHelp.after": [" on your Headscale server.", " 创建。"],
  "auth.signInApiKey": ["Sign in with API key", "使用 API 密钥登录"],
  "auth.secureCookies.title": ["Sign-in won't work over HTTP", "通过 HTTP 无法登录"],
  "auth.secureCookies.body": [
    "Headplane is set to use secure cookies, but this page was loaded over an insecure connection. ",
    "Headplane 配置为使用安全 Cookie，但当前页面通过不安全的连接加载。",
  ],
  "auth.signedInAs.before": ["Signed in as ", "当前登录账号："],
  "auth.signedInAs.after": [".", "。"],
  "auth.signOut": ["Sign out", "退出登录"],
  "auth.shell.description": ["The web interface for Headscale.", "Headscale 的 Web 管理界面。"],
  "auth.logout.title": ["You're signed out", "你已退出登录"],
  "auth.logout.description": ["You can close this window.", "你可以关闭此窗口。"],
  "auth.link.title": ["Link your account", "关联账号"],
  "auth.link.description": [
    "Headplane couldn't match your sign-in to a Headscale user. Pick the one that's yours.",
    "Headplane 无法将你的登录身份与 Headscale 用户匹配，请选择属于你的用户。",
  ],
  "auth.link.user": ["Headscale user", "Headscale 用户"],
  "auth.link.select": ["Select a user", "选择用户"],
  "auth.link.submit": ["Link account", "关联账号"],
  "auth.link.skip": ["Skip for now", "暂时跳过"],
  "auth.link.explanation": [
    "You'll add machines and create auth keys as this user. You can change it later from the Users page.",
    "你将以此用户身份添加设备并创建认证密钥，之后可以在用户页面修改。",
  ],
  "auth.link.invalid": [
    "That user can't be linked anymore. Pick another.",
    "该用户已无法关联，请选择其他用户。",
  ],
  "auth.oidc.unavailable.title": ["Single sign-on is unavailable", "单点登录不可用"],
  "auth.oidc.unavailable.body": [
    "Headplane can't reach your identity provider right now. You can still sign in with an API key.",
    "Headplane 暂时无法连接身份提供方，你仍可使用 API 密钥登录。",
  ],
  "auth.oidc.misconfigured.title": ["Single sign-on is misconfigured", "单点登录配置错误"],
  "auth.oidc.failed.title": ["Single sign-on failed", "单点登录失败"],
  "auth.oidc.troubleshooting": ["Troubleshooting", "故障排查"],
  "auth.oidc.invalidApiKey": [
    "The provided API key for OIDC authentication is invalid. Ensure that headscale.api_key is a valid API key.",
    "用于 OIDC 认证的 API 密钥无效，请确认 headscale.api_key 是有效的 API 密钥。",
  ],
  "auth.oidc.missingEndpoints": [
    "The OIDC provider is missing required endpoints. Ensure the discovery URL is correct or provide manual endpoint overrides in your configuration.",
    "OIDC 提供方缺少必要端点，请确认 discovery URL 正确，或在配置中手动指定端点。",
  ],
  "auth.oidc.discoveryFailed": [
    "Unable to reach the OIDC provider for discovery. SSO will retry on the next login attempt.",
    "无法连接 OIDC 提供方进行 discovery，下次登录时将重试单点登录。",
  ],
  "auth.oidc.unknownConfig": [
    "An unknown OIDC configuration error occurred. Please check the Headplane logs for more information.",
    "发生未知的 OIDC 配置错误，请查看 Headplane 日志了解详情。",
  ],
  "auth.oidc.noQuery": [
    "The SSO provider did not correctly redirect back to Headplane with the required parameters. Please ensure your SSO provider is configured correctly.",
    "SSO 提供方未能携带必要参数正确返回 Headplane，请检查 SSO 配置。",
  ],
  "auth.oidc.noSession": [
    "Unable to complete SSO login due to missing or invalid session data. Ensure that your Headplane cookie configuration is correct and that your browser is accepting cookies.",
    "由于会话数据缺失或无效，无法完成 SSO 登录。请检查 Headplane Cookie 配置以及浏览器是否允许 Cookie。",
  ],
  "auth.oidc.noSub": [
    "The SSO provider did not return a valid user identifier. Please ensure your SSO provider is configured to provide the sub claim.",
    "SSO 提供方未返回有效的用户标识，请确保其会提供 sub 声明。",
  ],
  "auth.oidc.authFailed": [
    "Authentication with the SSO provider failed. Please try again later. Headplane logs may provide more information.",
    "SSO 提供方认证失败，请稍后重试，Headplane 日志可能包含更多信息。",
  ],
  "auth.oidc.unknown": [
    "An unknown error occurred during OIDC authentication. Please try again later.",
    "OIDC 认证过程中发生未知错误，请稍后重试。",
  ],
  "home.title": ["Connect your devices", "连接你的设备"],
  "home.description": [
    "You don't have access to the dashboard, but your devices can still join the network.",
    "你没有控制台访问权限，但你的设备仍然可以加入网络。",
  ],
  "home.install.title": ["Install Tailscale", "安装 Tailscale"],
  "home.install.linux": ["On Linux, use the install script (", "在 Linux 上使用安装脚本（"],
  "home.install.source": ["source", "源码"],
  "home.install.after": ["):", "）："],
  "home.signIn.title": ["Sign in to this network", "登录此网络"],
  "home.signIn.instructions": [
    "Then open the link it prints. In the desktop and mobile apps, set a custom coordination server to {server} instead.",
    "然后打开它输出的链接。在桌面和移动应用中，请将自定义协调服务器设置为 {server}。",
  ],
  "home.approval": ["An administrator approves each new device.", "管理员会批准每台新设备。"],
  "home.approvalFuture": ["They'll also approve each new device.", "他们也会批准每台新设备。"],
  "home.linkedAs": ["Linked as {name}", "已关联为 {name}"],
  "home.linked": ["Your account is linked", "你的账号已关联"],
  "home.waiting": ["Waiting for your first device…", "正在等待你的第一台设备…"],
  "home.waitingDetail": [
    "Your account links once a device signs in with single sign-on. Not linking? Ask an administrator.",
    "当设备通过单点登录登录后，你的账号会自动关联。仍未关联？请联系管理员。",
  ],
  "home.askAdmin": ["Ask an administrator to link your account", "请联系管理员关联你的账号"],
  "common.docs": ["Docs", "文档"],
  "common.search": ["Search", "搜索"],
  "common.actions": ["Actions", "操作"],
  "common.user": ["User", "用户"],
  "common.role": ["Role", "角色"],
  "common.created": ["Created", "创建时间"],
  "common.expires": ["Expires", "过期时间"],
  "common.lastSeen": ["Last seen", "最后在线"],
  "common.lastLogin": ["Last login", "最后登录"],
  "common.status": ["Status", "状态"],
  "common.name": ["Name", "名称"],
  "common.version": ["Version", "版本"],
  "common.address": ["Addresses", "地址"],
  "common.save": ["Save", "保存"],
  "common.cancel": ["Cancel", "取消"],
  "common.done": ["Done", "完成"],
  "common.delete": ["Delete", "删除"],
  "common.rename": ["Rename", "重命名"],
  "common.close": ["Close", "关闭"],
  "common.noResults": ["No results found.", "未找到结果。"],
  "machines.title": ["Machines", "设备"],
  "machines.description": ["Devices connected to your tailnet.", "连接到你的 Tailnet 的设备。"],
  "machines.search": ["Search machines", "搜索设备"],
  "machines.searchPlaceholder": ["Search by name or IP", "按名称或 IP 搜索"],
  "machines.clearSearch": ["Clear search", "清除搜索"],
  "machines.count": ["{count} machines", "{count} 台设备"],
  "machines.filteredCount": ["Showing {shown} of {total} machines", "显示 {shown}/{total} 台设备"],
  "machines.empty": ["No machines match the current filters", "没有设备符合当前筛选条件"],
  "machines.connected": ["Connected", "已连接"],
  "machines.unknown": ["Unknown", "未知"],
  "machines.updateAvailable": ["Update available", "有可用更新"],
  "machines.add": ["Add device", "添加设备"],
  "machines.magicDnsTooltip": [
    "Since MagicDNS is enabled, you can access devices based on their name and also at [name].{domain}",
    "启用 MagicDNS 后，你可以通过设备名称访问，也可以使用 [name].{domain}。",
  ],
  "machines.filterUser": ["User", "用户"],
  "machines.filterTag": ["Tag", "标签"],
  "machines.filterStatus": ["Status", "状态"],
  "machines.filterRoute": ["Route", "路由"],
  "machines.clearFilters": ["Clear filters", "清除筛选"],
  "machines.tagOwned": ["Tag-owned", "标签设备"],
  "machines.online": ["Online", "在线"],
  "machines.offline": ["Offline", "离线"],
  "machines.expired": ["Expired", "已过期"],
  "machines.exitNode": ["Exit node", "出口节点"],
  "machines.subnetRouter": ["Subnet router", "子网路由器"],
  "machines.updateTooltip": ["Tailscale {version} is available.", "Tailscale {version} 可用。"],
  "machines.copied": ["Copied {value}", "已复制 {value}"],
  "machines.copyFailed": ["Copy failed. Copy the address manually.", "复制失败，请手动复制地址。"],
  "users.title": ["Users", "用户"],
  "users.headplaneUsers": ["Headplane users", "Headplane 用户"],
  "users.noHeadplaneUsers": [
    "No users have signed into Headplane yet.",
    "尚无用户登录 Headplane。",
  ],
  "users.unlinked": ["Unlinked Headscale users", "未关联的 Headscale 用户"],
  "users.unlinkedDescription": [
    "These Headscale users have no Headplane account, so Headplane can't manage their access.",
    "这些 Headscale 用户没有 Headplane 账号，因此 Headplane 无法管理其访问权限。",
  ],
  "users.oidcDescription": [
    "People who can sign in to Headplane, managed through your OIDC provider.",
    "可通过 OIDC 提供方登录 Headplane 的用户。",
  ],
  "users.localDescription": [
    "People in your tailnet, managed locally.",
    "本机管理的 Tailnet 用户。",
  ],
  "users.oidcLink": ["OIDC provider", "OIDC 提供方"],
  "users.oidcSetup": ["Set up OIDC", "配置 OIDC"],
  "users.noMachines": ["No machines", "无设备"],
  "users.neverSeen": ["Never seen", "从未在线"],
  "users.never": ["Never", "从未"],
  "users.notLinked": ["Not linked", "未关联"],
  "role.owner": ["Owner", "所有者"],
  "role.admin": ["Admin", "管理员"],
  "role.networkAdmin": ["Network Admin", "网络管理员"],
  "role.itAdmin": ["IT Admin", "IT 管理员"],
  "role.auditor": ["Auditor", "审计员"],
  "role.viewer": ["Viewer", "只读用户"],
  "role.member": ["Member", "成员"],
  "role.unknown": ["Unknown", "未知"],
  "dns.title": ["DNS", "DNS"],
  "dns.description": [
    "Control how devices on your tailnet resolve names.",
    "控制 Tailnet 设备如何解析名称。",
  ],
  "dns.permissionDenied": [
    "Your permissions don't allow changes to DNS settings.",
    "你的权限不允许修改 DNS 设置。",
  ],
  "dns.readOnly": [
    "The Headscale configuration is read-only, so DNS settings can't be changed here.",
    "Headscale 配置为只读，因此无法在此修改 DNS 设置。",
  ],
  "dns.restart.before": [
    "Changes are saved to the Headscale configuration but only take effect once Headscale restarts. Set up an ",
    "更改会写入 Headscale 配置，但需要重启 Headscale 后才会生效。请配置",
  ],
  "dns.restart.link": ["integration", "集成"],
  "dns.restart.after": [" to restart it automatically.", "以自动重启。"],
  "dns.general.title": ["General", "常规"],
  "dns.general.description": [
    "Your tailnet domain and how devices pick a DNS server.",
    "Tailnet 域名以及设备选择 DNS 服务器的方式。",
  ],
  "dns.tailnetName": ["Tailnet name", "Tailnet 名称"],
  "dns.magicDns": ["Magic DNS", "Magic DNS"],
  "dns.magicOff": ["Devices are only reachable by IP", "设备只能通过 IP 访问"],
  "dns.override": ["Override local DNS", "覆盖本地 DNS"],
  "dns.overrideOn": [
    "Devices send all queries to the nameservers below",
    "设备将所有查询发送到下方名称服务器",
  ],
  "dns.overrideOff": ["Devices keep their own DNS settings", "设备保留自己的 DNS 设置"],
  "dns.saveFailed": ["Couldn't save the setting.", "无法保存设置。"],
  "dns.nameservers.title": ["Nameservers", "名称服务器"],
  "dns.nameservers.description": [
    "The servers devices use for names outside the tailnet, preferring ones higher in the list. A server marked with a domain only answers for that domain.",
    "设备用于解析 Tailnet 之外名称的服务器，列表中越靠前优先级越高。标记了域名的服务器仅响应该域名。",
  ],
  "dns.nameservers.empty": [
    "No nameservers. Devices use their own DNS settings.",
    "没有名称服务器，设备使用自己的 DNS 设置。",
  ],
  "dns.records.title": ["DNS records", "DNS 记录"],
  "dns.records.description": [
    "Point a name at an address for every device on the tailnet. Headscale supports A and AAAA records.",
    "为 Tailnet 中的所有设备将名称指向地址，Headscale 支持 A 和 AAAA 记录。",
  ],
  "dns.records.empty": ["No DNS records", "没有 DNS 记录"],
  "dns.domains.title": ["Search domains", "搜索域"],
  "dns.domains.description": [
    "Devices try these suffixes, in order, when resolving a short name. With Magic DNS on, your tailnet domain always comes first.",
    "解析短名称时，设备会按顺序尝试这些后缀。启用 Magic DNS 后，Tailnet 域名始终优先。",
  ],
  "dns.domains.empty": ["No search domains", "没有搜索域"],
  "network.title": ["Network address pools", "网络地址池"],
  "network.description": [
    "Choose private address ranges for each user's devices. New devices receive their addresses from the owner's pool.",
    "为每个用户的设备选择私有网段，新设备会从所属用户的地址池中分配地址。",
  ],
  "network.description.admin": [
    "Manage address pools for every Headscale user. New devices receive their addresses from the owner's pool.",
    "管理所有 Headscale 用户的地址池，新设备会从所属用户的地址池中分配地址。",
  ],
  "network.readOnly.title": ["Address pool editing is unavailable", "无法编辑地址池"],
  "network.readOnly.body": [
    "Set policy.mode to database in the Headscale configuration before editing address pools here.",
    "请先在 Headscale 配置中将 policy.mode 设置为 database，然后才能在此编辑地址池。",
  ],
  "network.readOnly.form": [
    "The ACL policy is read-only, so changes cannot be saved.",
    "访问控制策略为只读，无法保存更改。",
  ],
  "network.policyError.title": ["The ACL policy needs attention", "ACL 策略需要处理"],
  "network.unlinked.title": ["Link your Headscale user", "请关联 Headscale 用户"],
  "network.unlinked.body": [
    "Address pools belong to a Headscale user. Sign in to a device with this account first, or use the account linking page, then reload this page.",
    "地址池归属于 Headscale 用户。请先用此账号登录一台设备，或在账号关联页面完成绑定，然后刷新此页面。",
  ],
  "network.adminScope": [
    "You can manage every user because you have policy write access. Regular users can only manage their own linked user.",
    "你拥有策略写入权限，因此可以管理所有用户；普通用户只能管理自己关联的用户。",
  ],
  "network.noUsers": ["There are no users to manage.", "没有可管理的用户。"],
  "network.user.globalPool": [
    "No custom pool. Global Headscale allocation is used.",
    "未设置自定义地址池，使用 Headscale 全局分配。",
  ],
  "network.user.nodes": ["Devices", "设备"],
  "network.user.noNodes": ["No devices use this account yet.", "此账号下还没有设备。"],
  "network.user.poolLabel": ["Address pool", "地址池"],
  "network.user.poolHelp": [
    "Enter CIDR ranges separated by newlines, spaces, or commas. IPv4 can use 10/8, 172.16/12, 192.168/16, or 100.64/10; IPv6 must be a ULA inside fc00::/7. Leave empty to return to global allocation.",
    "输入 CIDR 网段，可用换行、空格或逗号分隔。IPv4 可使用 10/8、172.16/12、192.168/16 或 100.64/10；IPv6 必须是 fc00::/7 内的 ULA。留空则恢复全局分配。",
  ],
  "network.user.suggest": ["Suggest free ranges", "建议空闲网段"],
  "network.user.save": ["Save address pool", "保存地址池"],
  "network.user.validationErrors": ["Conflicts to fix", "需要修复的冲突"],
  "network.user.routeBehaviour": ["Client routing", "客户端路由"],
  "network.user.exactRoutes": [
    "Custom IPv4 pools enable exact /32 host routes on every client, so private ranges are routed to the correct device instead of the whole 100.64/10 CGNAT range.",
    "启用自定义 IPv4 地址池后，所有客户端都会使用精确的 /32 主机路由，私有网段会转发到正确设备，而不会走整个 100.64/10 CGNAT 网段。",
  ],
  "network.user.quad100": [
    "Quad100 (100.115.92.0/23) and MagicDNS (100.100.100.0/24) remain reserved and are never assigned to users.",
    "Quad100 (100.115.92.0/23) 与 MagicDNS (100.100.100.0/24) 始终保留，不会分配给用户。",
  ],
  "network.user.knownConflicts": ["Known reservations", "已知占用"],
  "network.user.noKnownConflicts": [
    "No other user pool or node address conflicts with this pool.",
    "没有其他用户地址池或节点地址与此地址池冲突。",
  ],
  "network.user.otherPools": ["Other user pools", "其他用户地址池"],
  "network.user.otherAddresses": ["Other node addresses", "其他节点地址"],
  "network.user.existingAddresses": ["Existing addresses for this user", "此用户已有地址"],
  "network.route.title": ["Check the client network", "检查客户端网络"],
  "network.route.description": [
    "A browser cannot read a device's local routes or firewall. Paste ip route, ip -6 route, netstat -rn, Windows route print, VPN routes, or firewall output to check for real conflicts before saving.",
    "浏览器无法自动读取设备的本地路由或防火墙。请粘贴 ip route、ip -6 route、netstat -rn、Windows route print、VPN 路由或防火墙输出，在保存前检查真实冲突。",
  ],
  "network.route.label": ["Paste route or firewall output", "粘贴路由或防火墙输出"],
  "network.route.placeholder": [
    "ip route\nip -6 route\n# macOS: netstat -rn\n# Windows: route print\n# VPN routes and firewall rules can also be pasted",
    "ip route\nip -6 route\n# macOS: netstat -rn\n# Windows: route print\n# 也可以粘贴 VPN 路由和防火墙规则",
  ],
  "network.route.enterPoolFirst": [
    "Enter a valid address pool first to check the pasted output.",
    "请先输入有效的地址池，再检查粘贴的内容。",
  ],
  "network.route.conflicts": ["Route conflicts block saving", "路由冲突会阻止保存"],
  "network.route.firewall": ["Firewall rules to review", "需要检查的防火墙规则"],
  "settings.title": ["Settings", "设置"],
  "settings.description": [
    "How machines join your tailnet, who can sign in, and the Headplane agent.",
    "设备如何加入 Tailnet、谁可以登录，以及 Headplane Agent 设置。",
  ],
  "settings.authKeys": ["Auth keys", "认证密钥"],
  "settings.general": ["Server settings", "服务器设置"],
  "settings.restrictions": ["Sign-in restrictions", "登录限制"],
  "settings.agent": ["Agent", "Agent"],
  "settings.general.title": ["Server settings", "服务器设置"],
  "settings.general.description": [
    "Safe Headscale runtime settings that can be changed without exposing secrets or network listeners.",
    "可安全修改的 Headscale 运行参数，不会暴露密钥或监听地址。",
  ],
  "settings.general.readOnly": [
    "The Headscale configuration file is read-only, so these settings can't be changed here.",
    "Headscale 配置文件为只读，无法在此修改这些设置。",
  ],
  "settings.general.restart": [
    "Changes are written to the Headscale configuration and take effect after Headscale restarts. Configure a Headplane integration to restart it automatically.",
    "更改会写入 Headscale 配置，并在 Headscale 重启后生效。可配置 Headplane 集成来自动重启。",
  ],
  "settings.general.node.title": ["Node lifecycle", "节点生命周期"],
  "settings.general.node.description": [
    "Set the default key expiry for personal devices. Tagged devices never expire.",
    "设置个人设备的默认密钥有效期，带标签的设备不会过期。",
  ],
  "settings.general.node.expiry": ["Default node expiry", "默认节点有效期"],
  "settings.general.node.expiryHelp": [
    "Use a Headscale duration such as 30m, 24h, 30d or 180d. Set 0 to disable expiry.",
    "使用 Headscale 时长格式，例如 30m、24h、30d 或 180d。设为 0 表示永不过期。",
  ],
  "settings.general.features.title": ["Client features", "客户端功能"],
  "settings.general.features.description": [
    "Control tailnet-wide defaults that Headscale sends to clients.",
    "控制 Headscale 下发给客户端的 Tailnet 全局默认值。",
  ],
  "settings.general.taildrop": ["Taildrop", "Taildrop 文件传输"],
  "settings.general.taildrop.description": [
    "Allow devices to send files to each other.",
    "允许设备之间发送文件。",
  ],
  "settings.general.autoUpdate": ["Client auto-update default", "客户端自动更新默认值"],
  "settings.general.autoUpdate.description": [
    "Make clients auto-update unless they have chosen otherwise locally.",
    "除非客户端本地另有设置，否则默认自动更新。",
  ],
  "settings.general.server.title": ["Server behaviour", "服务器行为"],
  "settings.general.server.description": [
    "Update checks and logging for this Headscale instance.",
    "此 Headscale 实例的更新检查和日志设置。",
  ],
  "settings.general.checkUpdates": ["Disable update checks", "禁用更新检查"],
  "settings.general.checkUpdates.description": [
    "Stop Headscale from checking for new releases on startup.",
    "阻止 Headscale 在启动时检查新版本。",
  ],
  "settings.general.logLevel": ["Log level", "日志级别"],
  "settings.general.logLevel.description": [
    "Lower levels are more verbose. Use debug or trace temporarily when troubleshooting.",
    "级别越低日志越详细。排查问题时可临时使用 debug 或 trace。",
  ],
  "settings.general.saveFailed": ["Couldn't save the setting.", "无法保存设置。"],
  "settings.general.policy.title": ["Policy storage", "策略存储"],
  "settings.general.policy.description": [
    "Where Headscale keeps ACL policy and per-user address pools.",
    "Headscale 保存 ACL 策略和用户地址池的位置。",
  ],
  "settings.general.policy.note": [
    "Per-user address pools are edited through the policy API and require policy.mode: database. Change policy.mode manually in the Headscale configuration; it is intentionally not editable here because switching storage can make existing ACLs disappear from the dashboard.",
    "用户地址池通过策略 API 编辑，需要 policy.mode: database。请手动在 Headscale 配置中修改 policy.mode；此页面不提供切换，以免现有 ACL 从控制台消失。",
  ],
  "settings.authKeys.description": [
    "Register machines without signing in.",
    "无需登录即可注册设备。",
  ],
  "settings.authKeys.noAccess": [
    "Your permissions don't allow creating auth keys. Ask an administrator to create one for you.",
    "你的权限不允许创建认证密钥，请联系管理员。",
  ],
  "settings.authKeys.missing.title": ["Some keys couldn't be loaded", "部分密钥无法加载"],
  "settings.authKeys.missing.body": [
    "Headplane couldn't fetch the keys for {users}. Check the server logs for details.",
    "Headplane 无法获取 {users} 的密钥，请查看服务器日志。",
  ],
  "settings.authKeys.empty": ["No auth keys yet.", "尚无认证密钥。"],
  "settings.authKeys.noMatch": ["No keys match these filters.", "没有密钥符合当前筛选条件。"],
  "settings.authKeys.key": ["Key", "密钥"],
  "settings.authKeys.tagsOnly": ["Tags only", "仅标签"],
  "settings.authKeys.active": ["Active", "有效"],
  "settings.authKeys.reusable": ["Reusable", "可重复使用"],
  "settings.authKeys.ephemeral": ["Ephemeral", "临时"],
  "settings.authKeys.keyCount": ["{count} keys", "{count} 个密钥"],
  "settings.authKeys.keyCountOne": ["1 key", "1 个密钥"],
  "acls.title": ["Access controls", "访问控制"],
  "acls.pageTitle": ["Access Control List (ACL)", "访问控制列表 (ACL)"],
  "acls.description": [
    "The ACL file defines the access control rules for your network. Learn more in the",
    "ACL 文件用于定义网络的访问控制规则，详情请参阅",
  ],
  "acls.tailscaleGuide": ["Tailscale ACL guide", "Tailscale ACL 指南"],
  "acls.headscaleDocs": ["Headscale docs", "Headscale 文档"],
  "acls.restricted.title": ["ACL Policy restricted", "ACL 策略受限"],
  "acls.restricted.body": [
    "You do not have the necessary permissions to edit the Access Control List policy. Please contact your administrator to request access or to make changes to the ACL policy.",
    "你没有编辑访问控制策略的权限，请联系管理员申请权限或修改 ACL 策略。",
  ],
  "acls.readOnly.title": ["Read-only ACL Policy", "ACL 策略只读"],
  "acls.readOnly.body": [
    "The ACL policy mode is most likely set to file in your Headscale configuration, so the ACL file cannot be edited through the web interface. Set policy.mode to database in your Headscale configuration to edit it here.",
    "Headscale 配置中的 ACL 策略模式很可能为 file，因此无法通过 Web 界面编辑 ACL 文件。请将 Headscale 配置中的 policy.mode 设置为 database。",
  ],
  "acls.saveFailed.title": ["Couldn't save the policy", "无法保存策略"],
  "acls.editor": ["ACL Editor", "ACL 编辑器"],
  "acls.rules": ["Rules", "规则"],
  "acls.tagsGroups": ["Tags & Groups", "标签与用户组"],
  "acls.editFile": ["Edit file", "编辑文件"],
  "acls.previewChanges": ["Preview changes", "预览更改"],
  "acls.previewRules": ["Preview rules", "预览规则"],
  "acls.parseError.title": ["Policy cannot be edited visually", "无法可视化编辑策略"],
  "acls.parseError.body": [
    "The policy could not be parsed ({error}). Fix it in the Edit file tab and the visual editor will come back.",
    "无法解析策略（{error}）。请在“编辑文件”标签中修复，随后可视化编辑器会恢复。",
  ],
  "acls.comments.title": ["Comments will be removed", "注释将被移除"],
  "acls.comments.body": [
    "This policy contains comments. Saving a change made in the visual editor rewrites the policy and drops them.",
    "此策略包含注释。在可视化编辑器中保存更改会重写策略并移除注释。",
  ],
  "acls.previewUnavailable": [
    "Previewing rules is not available yet. This feature is still in development and is pretty complicated to implement. Hopefully I will be able to get to it soon.",
    "规则预览尚未提供。此功能仍在开发中，实现较为复杂，敬请期待。",
  ],
  "acls.discard": ["Discard changes", "放弃更改"],
  "acls.missingFile.title": ["The policy file is missing", "策略文件不存在"],
  "acls.missingFile.body": [
    "Headscale is set to read its policy from a file, and that file doesn't exist. Create it at the path in Headscale's config, or set policy.mode to database so Headplane can manage the policy here.",
    "Headscale 配置为从文件读取策略，但该文件不存在。请在 Headscale 配置的路径创建文件，或将 policy.mode 设置为 database，让 Headplane 在此管理策略。",
  ],
} as const satisfies Record<string, readonly [string, string]>;

export type MessageKey = keyof typeof messages;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh-CN";
}

function normalizeLocale(value: string | null | undefined): Locale | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }
  if (normalized.startsWith("en")) {
    return "en";
  }
  return undefined;
}

function localeFromCookie(request: Request): Locale | undefined {
  const header = request.headers.get("Cookie");
  if (!header) {
    return undefined;
  }
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === localeCookie) {
      try {
        return normalizeLocale(decodeURIComponent(rest.join("=")));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function localeFromAcceptLanguage(request: Request): Locale | undefined {
  const header = request.headers.get("Accept-Language");
  if (!header) {
    return undefined;
  }
  let best: { locale: Locale; quality: number } | undefined;
  for (const part of header.split(",")) {
    const [tag, ...params] = part.trim().split(";");
    const locale = normalizeLocale(tag);
    if (!locale) {
      continue;
    }
    const qualityParam = params.find((param) => param.trim().startsWith("q="));
    const quality = qualityParam ? Number.parseFloat(qualityParam.trim().slice(2)) : 1;
    if (!Number.isNaN(quality) && (!best || quality > best.quality)) {
      best = { locale, quality };
    }
  }
  return best && best.quality > 0 ? best.locale : undefined;
}

export function getLocale(request: Request): Locale {
  const url = new URL(request.url);
  return (
    normalizeLocale(url.searchParams.get("lang")) ??
    localeFromCookie(request) ??
    localeFromAcceptLanguage(request) ??
    "en"
  );
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const entry = messages[key];
  return interpolate(entry[locale === "zh-CN" ? 1 : 0], vars);
}

const sourceMessages = new Map<string, string>([
  ...Object.values(messages).map(([english, chinese]) => [english, chinese] as const),
  ...Object.entries(uiMessages),
]);

export function translateText(
  locale: Locale,
  source: string,
  vars?: Record<string, string | number>,
): string {
  return interpolate(locale === "zh-CN" ? (sourceMessages.get(source) ?? source) : source, vars);
}

interface I18nContextValue {
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  text: (source: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: (key, vars) => translate("en", key, vars),
  text: (source, vars) => translateText("en", source, vars),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
      text: (source, vars) => translateText(locale, source, vars),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export function localeSwitchHref(locale: Locale, returnTo: string): string {
  const params = new URLSearchParams({ lang: locale, return_to: returnTo });
  return `/idp/language?${params.toString()}`;
}

export function adminPath(basePath: string, path: string): string {
  const prefix = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  return path === "/" ? `${prefix}/` : `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}
