browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	const tabId = request.tabId;
	if (request.action === "startReload") {
		const frequency = request.frequency;
		browser.alarms.create(`reload_${tabId}`, {
			periodInMinutes: frequency / 60,
		});
		browser.storage.local.set({
			[`reloadFrequency_${tabId}`]: frequency,
			[`isReloading_${tabId}`]: true,
		});
		browser.action.setIcon({
			path: "../images/reload-active.png",
			tabId: tabId,
		});
		sendResponse({ status: "Reload started for tab " + tabId });
	} else if (request.action === "stopReload") {
		browser.alarms.clear(`reload_${tabId}`);
		browser.storage.local.set({
			[`isReloading_${tabId}`]: false,
		});
		browser.action.setIcon({ path: "../images/reload.png", tabId: tabId });
		sendResponse({ status: "Reload stopped for tab " + tabId });
	}
});

browser.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name.startsWith("reload_")) {
		const tabId = parseInt(alarm.name.split("_")[1], 10);
		browser.tabs.reload(tabId).catch(() => {
			browser.alarms.clear(alarm.name);
			browser.storage.local.set({ [`isReloading_${tabId}`]: false });
		});
	}
});

browser.runtime.onStartup.addListener(() => {
	browser.storage.local.get(null).then((data) => {
		for (const key in data) {
			if (key.startsWith("isReloading_") && data[key]) {
				const tabId = parseInt(key.split("_")[1], 10);
				const frequency = data[`reloadFrequency_${tabId}`];
				browser.alarms.create(`reload_${tabId}`, {
					periodInMinutes: frequency / 60,
				});
				browser.action.setIcon({
					path: "../images/reload-active.png",
					tabId: tabId,
				});
			}
		}
	});
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete") {
		browser.storage.local.get([`isReloading_${tabId}`]).then((data) => {
			if (data[`isReloading_${tabId}`]) {
				browser.action.setIcon({
					path: "../images/reload-active.png",
					tabId: tabId,
				});
			} else {
				browser.action.setIcon({
					path: "../images/reload.png",
					tabId: tabId,
				});
			}
		});
	}
});
