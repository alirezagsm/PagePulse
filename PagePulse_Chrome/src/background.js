let reloadIntervals = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	const tabId = request.tabId;
	if (request.action === "startReload") {
		const frequency = request.frequency;
		if (reloadIntervals[tabId]) {
			clearInterval(reloadIntervals[tabId]);
			delete reloadIntervals[tabId];
		}
		chrome.alarms.clear(`reload_${tabId}`);

		if (frequency >= 60) {
			chrome.alarms.create(`reload_${tabId}`, {
				periodInMinutes: frequency / 60,
			});
		} else {
			reloadIntervals[tabId] = setInterval(() => {
				chrome.tabs.reload(tabId);
			}, frequency * 1000);
		}

		chrome.storage.local.set({
			[`reloadFrequency_${tabId}`]: frequency,
			[`isReloading_${tabId}`]: true,
		});
		chrome.action.setIcon({
			path: "../images/reload-active.png",
			tabId: tabId,
		});
		sendResponse({ status: "Reload started for tab " + tabId });
	} else if (request.action === "stopReload") {
		chrome.alarms.clear(`reload_${tabId}`);
		if (reloadIntervals[tabId]) {
			clearInterval(reloadIntervals[tabId]);
			delete reloadIntervals[tabId];
		}
		chrome.storage.local.set({
			[`isReloading_${tabId}`]: false,
		});
		chrome.action.setIcon({ path: "../images/reload.png", tabId: tabId });
		sendResponse({ status: "Reload stopped for tab " + tabId });
	}
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name.startsWith("reload_")) {
		const tabId = parseInt(alarm.name.split("_")[1], 10);
		chrome.tabs.reload(tabId, (updatedTab) => {
			if (chrome.runtime.lastError) {
				chrome.alarms.clear(alarm.name);
				chrome.storage.local.set({ [`isReloading_${tabId}`]: false });
			}
		});
	}
});

chrome.runtime.onStartup.addListener(() => {
	chrome.storage.local.get(null, (data) => {
		for (const key in data) {
			if (key.startsWith("isReloading_") && data[key]) {
				const tabId = parseInt(key.split("_")[1], 10);
				const frequency = data[`reloadFrequency_${tabId}`];

				if (frequency >= 60) {
					chrome.alarms.create(`reload_${tabId}`, {
						periodInMinutes: frequency / 60,
					});
				} else {
					reloadIntervals[tabId] = setInterval(() => {
						chrome.tabs.reload(tabId);
					}, frequency * 1000);
				}

				chrome.action.setIcon({
					path: "../images/reload-active.png",
					tabId: tabId,
				});
			}
		}
	});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete") {
		chrome.storage.local.get([`isReloading_${tabId}`], (data) => {
			if (data[`isReloading_${tabId}`]) {
				chrome.action.setIcon({
					path: "../images/reload-active.png",
					tabId: tabId,
				});
			} else {
				chrome.action.setIcon({
					path: "../images/reload.png",
					tabId: tabId,
				});
			}
		});
	}
});
