<template lang="pug">
#user
	h2.text-accent.text-2xl.mb-4 User
	p {{user?.username}}
</template>

<script setup lang="ts">
import {ref} from 'vue';
import type {User} from '../scripts/types';
import {useRoute} from 'vue-router';
import {UserAPI} from '../scripts/api';

const user = ref<User | null>(null);
const route = useRoute();

if (Array.isArray(route.params.username)) {
	throw new Error('Username parameter must not be an array');
}

console.log(route.params);

UserAPI.getByUsername(route.params.username).then((u) => (user.value = u));
</script>

<style scoped></style>
