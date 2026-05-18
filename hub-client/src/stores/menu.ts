// Packages
import { defineStore } from 'pinia';
import { useSettings, FeatureFlag } from '@hub-client/stores/settings';
import { type RouteLocationRaw, type RouteRecordRaw, type Router } from 'vue-router';

// Types
type MenuItem = {
	key: string; // i18n key for name
	icon?: string;
	to: RouteLocationRaw; // router-to object
	path?: string;
	featureFlag?: FeatureFlag;
};

type MenuItems = Array<MenuItem>;

const defaultMenu: MenuItems = [
	{ key: 'menu.home', icon: 'house', to: { name: 'home' }, path: '/' },
	{ key: 'menu.directmsg', icon: 'chat-circle-text', to: { name: 'direct-msg' }, path: '/direct-msg' },
	{ key: 'menu.discover', icon: 'compass', to: { name: 'discover-rooms' }, path: '/discover-rooms' },
	{ key: 'menu.calendar', icon: 'calendar', to: { name: 'calendar' }, path: '/calendar', featureFlag: FeatureFlag.events },
];

const useMenu = defineStore('menu', {
	state: () => {
		return {
			menu: defaultMenu,
			activeMenuItemId: '' as string,
		};
	},

	getters: {
		getMenu: (state): MenuItems => {
			const settings = useSettings();
			return state.menu.filter((item) => {
				if (item.featureFlag) {
					return settings.isFeatureEnabled(item.featureFlag);
				}
				return true;
			});
    	},
	},

	actions: {
		addMenuItem(item: MenuItem) {
			this.menu.push(item);
		},

		addMenuItemWithRoute(item: MenuItem, route: RouteRecordRaw, router: Router) {
			router.addRoute(route);
			this.addMenuItem(item);
		},

		setActiveMenuItem(id: string) {
			this.activeMenuItemId = id;
		},

		getMenuItemPath(routeName: string) {
			return this.$state.menu
				.filter((menuItem) => typeof menuItem.to !== 'string' && (menuItem.to as { name?: string })['name'] === routeName)
				.map((filteredMenuItem) => filteredMenuItem.path)
				.pop();
		},
	},
});

export { useMenu, MenuItem, MenuItems };
