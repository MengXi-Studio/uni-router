<script setup lang="ts">
onLaunch(() => {
	console.log('App Launch')
})

onShow(() => {
	console.log('App Show')
})

onHide(() => {
	console.log('App Hide')
})
</script>

<style lang="scss">
/*每个页面公共css */
.container {
	position: relative;
	min-height: 100vh;
	font-family: PingFangSC, PingFang SC;
	font-weight: 400;
	color: #333333;
	background: #fff;
	@include flex($direction: column);
	box-sizing: border-box;
}
</style>
