import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "../views/AdminLayout.vue";
import ItemList from "../views/ItemList.vue";
import ItemCreate from "../views/ItemCreate.vue";
import ItemEdit from "../views/ItemEdit.vue";


const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: 'items',
        component: ItemList
      },
      {
        path: 'items/:id/edit',
        component: ItemEdit
      },
      {
        path: 'items/new',
        component: ItemCreate
      }
    ]
  }
]


const router = createRouter({
  history: createWebHistory(),
  routes
});


export default router;