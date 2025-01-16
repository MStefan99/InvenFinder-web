import {ComputedRef, Ref, ref, toValue, watch} from 'vue';
import {LocationQuery, useRoute, useRouter} from 'vue-router';

export function useQuery<T extends LocationQuery>(q?: Ref<T> | ComputedRef<T>) {
	const router = useRouter();
	const route = useRoute();
	const query = ref(Object.keys(route.query).length ? route.query : ref(toValue(q)));

	watch(q, () => {
		for (const key in q.value) {
			if (typeof q.value[key] === 'string' && !q.value[key].length) {
				delete q.value[key];
			}
		}

		query.value = q.value;
		router.replace({name: route.name, query: query.value});
	});

	return {query};
}
