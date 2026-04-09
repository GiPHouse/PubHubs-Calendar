// Packages
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
<<<<<<< HEAD
=======
// Logic
import loglevel from 'loglevel';
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e
import mavonEditor from 'mavon-editor';
import 'mavon-editor/dist/css/index.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

// Assets
import '@hub-client/assets/datepicker.css';
import '@hub-client/assets/tailwind.css';

<<<<<<< HEAD
// Logic
import { clickOutside, contextMenu, focus, twClass } from '@hub-client/logic/core/directives';
import { router } from '@hub-client/logic/core/router';
=======
import { clickOutside, contextMenu, focus, twClass } from '@hub-client/logic/core/directives';
import { router } from '@hub-client/logic/core/router';
import { getLogLevel } from '@hub-client/logic/logging/Logger';
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e

// Pages
import App from '@hub-client/pages/App.vue';

<<<<<<< HEAD
import { ReplaceConsole } from '@hub-client/console';
import { setUpi18n } from '@hub-client/i18n';
import { registerComponents } from '@hub-client/registerComponents';

// Other

ReplaceConsole();
=======
import { setUpi18n } from '@hub-client/i18n';
import { registerComponents } from '@hub-client/registerComponents';

// Silence matrix-js-sdk's verbose HTTP logs; match our app log level
const matrixLevel = getLogLevel() === 'debug' ? 'DEBUG' : getLogLevel() === 'info' ? 'INFO' : getLogLevel() === 'error' ? 'ERROR' : 'WARN';
loglevel.getLogger('matrix').setLevel(matrixLevel);
>>>>>>> c63863ea3eaad8cf84505eb8d6c315eeb82a929e

const pinia = createPinia();
const app = createApp(App);

registerComponents(app);

const i18n = setUpi18n(app);
app.use(i18n);

app.use(router);
app.use(pinia);

app.use(mavonEditor);
app.directive('focus', focus);
app.directive('tw-class', twClass);
app.directive('click-outside', clickOutside);
app.directive('context-menu', contextMenu);
app.component('VueDatePicker', VueDatePicker);

app.mount('#app');
