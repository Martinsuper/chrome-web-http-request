import { createApp } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faGlobe,
  faPaperPlane,
  faCookie,
  faCopy,
  faRotate,
  faCheck,
  faTriangleExclamation,
  faCode,
  faXmark,
  faFileImport,
  faServer,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

// 添加图标到库
library.add(
  faGlobe,
  faPaperPlane,
  faCookie,
  faCopy,
  faRotate,
  faCheck,
  faTriangleExclamation,
  faCode,
  faXmark,
  faFileImport,
  faServer,
  faInfoCircle,
);

import App from './index.vue';

const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.mount('#app');
