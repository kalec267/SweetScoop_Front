<script setup="setup">

    import {ref, computed, onMounted} from "vue";
    import {useRoute, useRouter} from "vue-router";
    import api from "../api/axios";
    import MenuCard from "../components/MenuCard.vue";

    /* 0. 키오스크 기기 설정 (localStorage에서 동적 로드) */
    const currentBranchId = Number(localStorage.getItem("branchId")) || 1;
    const currentKioskId = Number(localStorage.getItem("kioskNo")) || 1;

    /* 1. Router와 URL 주문정보 */

    const route = useRoute();

    const router = useRouter();

    const orderType = route.query.orderType;

    const categoryId = Number(route.query.categoryId) || 1;

    const sizeId = route.query.sizeId
        ? Number(route.query.sizeId)
        : null;

    const cupId = route.query.cupId
        ? Number(route.query.cupId)
        : null;

    /* 2. 화면 상태
 *
 */

    const selectedCategory = ref(categoryId);

    const sizeInfo = ref({});

    const selectedCup = ref(null);

    const menus = ref([]);

    const selectedMenusByCategory = ref({
        1: [], // 아이스크림 맛
        2: [], // 아이스모찌
        3: [] // 커피
    });

    const loading = ref(false);

    //3. 커피 옵션 상태

    const coffeeOptions = ref([]);

    const coffeeSizes = ref([]);

    const showOptionModal = ref(false);

    const optionTargetMenu = ref(null);

    const selectedOptionIds = ref([]);

    const selectedCoffeeSizeId = ref(null);

    const loadingOptions = ref(false);

    const loadingCoffeeSizes = ref(false);

    /* 4. 장바구니 상태
 *
 */

    const cartItems = ref([]);

    const showCart = ref(false);

    /* 5. 화면 계산값
 *
 */

    const selectedMenus = computed({
        get() {
            return selectedMenusByCategory.value[selectedCategory.value];
        },

        set(value) {
            selectedMenusByCategory.value[selectedCategory.value] = value;
        }
    });

    const flavorSlots = computed(() => {
        // 아이스크림은 사이즈의 맛 개수만큼 고정 슬롯
        if (selectedCategory.value === 1) {
            return Array.from({
                length: Number(sizeInfo.value.flavorCnt) || 0
            });
        }

        // 아이스모찌와 커피는 선택한 메뉴 개수만큼 표시
        return Array.from({length: selectedMenus.value.length});
    });

    const selectedCount = computed(() => {
        return selectedMenus.value.length;
    });

    const isSelectionComplete = computed(() => {

        // 아이스크림은 사이즈의 맛 개수를 모두 채워야 완료
        if (selectedCategory.value === 1) {
            const flavorCnt = Number(sizeInfo.value.flavorCnt) || 0;

            return flavorCnt > 0 && selectedMenus.value.length === flavorCnt;
        }

        // 아이스모찌와 커피는 1개 이상 선택하면 완료
        return selectedMenus.value.length > 0;
    });

    const totalPrice = computed(() => {
        const sizePrice = Number(sizeInfo.value.price) || 0;
        const cupAdditionalPrice = Number(
            selectedCup.value
                ?.additionalPrice
        ) || 0;

        return sizePrice + cupAdditionalPrice;
    });

    const cartCount = computed(
        () => cartItems.value.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    );

    const cartTotalPrice = computed(() => cartItems.value.reduce(
        (sum, item) => sum + (Number(item.unitPrice ?? item.totalPrice) || 0) * (Number(item.quantity) || 1),
        0
    ));

    const selectedCoffeeSize = computed(() => {
        return coffeeSizes
            .value
            .find(size => Number(size.id) === Number(selectedCoffeeSizeId.value)) || null;
    });

    const coffeeSizeAdditionalPrice = computed(() => {
        return Number(
            selectedCoffeeSize.value
                ?.price
        ) || 0;
    });

    const selectedOptionPrice = computed(() => {
        return coffeeOptions
            .value
            .filter(option => selectedOptionIds.value.includes(option.id))
            .reduce((sum, option) => sum + (Number(option.price) || 0), 0);
    });

    const optionTargetTotalPrice = computed(() => {
        const menuPrice = Number(
            optionTargetMenu.value
                ?.price
        ) || 0;

        return (
            menuPrice + coffeeSizeAdditionalPrice.value + selectedOptionPrice.value
        );
    });

    const canMoveToPayment = computed(() => {

        const iceCreamMenus = selectedMenusByCategory.value[1];

        const mochiMenus = selectedMenusByCategory.value[2];

        const coffeeMenus = selectedMenusByCategory.value[3];

        const hasProduct = iceCreamMenus.length > 0 || mochiMenus.length > 0 || coffeeMenus.length > 0;

        if (!hasProduct) {
            return false;
        }

        if (selectedCategory.value === 1 && sizeId) {

            const flavorCnt = Number(sizeInfo.value.flavorCnt) || 0;

            return (flavorCnt > 0 && iceCreamMenus.length === flavorCnt);

        }

        return true;

    });

    /* 6. 기본 데이터 조회
 *
 */

    const loadSize = async () => {
        try {
            const response = await api.get(`/api/size/${sizeId}`);

            sizeInfo.value = response.data;
        } catch (error) {
            console.error("사이즈 조회 실패:", error);
        }
    };

    const loadSelectedCup = async () => {
        try {
            const response = await api.get("/api/cup");

            selectedCup.value = response
                .data
                .find(cup => Number(cup.id) === cupId) || null;
        } catch (error) {
            console.error("컵 정보 조회 실패:", error);
        }
    };

    const loadMenu = async (categoryId = 1) => {
        loading.value = true;

        try {
            const response = await api.get(`/api/menu/category/${categoryId}`);

            const menuList = Array.isArray(response.data)
                ? response.data
                : [];

            menus.value = menuList.map(menu => ({
                ...menu,
                id: Number(menu.id),
                categoryId: Number(menu.categoryId),
                price: Number(menu.price) || 0
            }));
        } catch (error) {
            console.error("메뉴 조회 실패:", error);
            menus.value = [];
        } finally {
            loading.value = false;
        }
    };

    const loadCoffeeOptions = async () => {
        loadingOptions.value = true;

        try {
            const response = await api.get("/api/menu-options/category/3");

            coffeeOptions.value = response.data;
        } catch (error) {
            console.error("커피 옵션 조회 실패:", error);

            coffeeOptions.value = [];
        } finally {
            loadingOptions.value = false;
        }
    };

    const loadCoffeeSizes = async () => {
        loadingCoffeeSizes.value = true;

        try {
            const response = await api.get("/api/size/category/3");

            coffeeSizes.value = Array.isArray(response.data)
                ? response.data
                : [];

            const regularSize = coffeeSizes
                .value
                .find(
                    size => ["regular", "(r)", "r"].includes(String(size.name || "").trim().toLowerCase())
                );

            selectedCoffeeSizeId.value = regularSize
                ?.id ?? coffeeSizes.value[0]
                    ?.id ?? null;
        } catch (error) {
            console.error("커피 사이즈 조회 실패:", error);
            coffeeSizes.value = [];
            selectedCoffeeSizeId.value = null;
        } finally {
            loadingCoffeeSizes.value = false;
        }
    };

    /* 7. 세션 저장 및 복원
 *
 */

    const loadCart = () => {
        try {
            const saved = sessionStorage.getItem("cartData");
            if (!saved) {
                cartItems.value = [];
                return;
            }

            const parsed = JSON.parse(saved);
            cartItems.value = Array.isArray(parsed.items)
                ? parsed.items
                : [];
        } catch (error) {
            console.error("장바구니 불러오기 실패:", error);
            cartItems.value = [];
            sessionStorage.removeItem("cartData");
        }
    };

    const saveCart = () => {
        sessionStorage.setItem("cartData", JSON.stringify({
            orderType: orderType || "TAKEOUT",
            customerId: null,
            branchId: currentBranchId,
            kioskId: currentKioskId,
            items: cartItems.value
        }));
    };

    const saveOrderData = () => {
    let orderData;

    try {
        const savedOrder =
            sessionStorage.getItem("orderData");

        orderData = savedOrder
            ? JSON.parse(savedOrder)
            : {};
    } catch (error) {
        console.error(
            "기존 주문 데이터 파싱 실패:",
            error
        );

        orderData = {};
    }

    const iceCreamMenus =
        selectedMenusByCategory.value[1] || [];

    const mochiMenus =
        selectedMenusByCategory.value[2] || [];

    const coffeeMenus =
        selectedMenusByCategory.value[3] || [];

    /*
     * 공통 주문 정보
     */
    orderData.orderType =
        orderType ||
        orderData.orderType ||
        "TAKEOUT";

    orderData.customerId =
        orderData.customerId ?? null;

    orderData.branchId =
        orderData.branchId ?? currentBranchId;

    orderData.kioskId =
        orderData.kioskId ?? currentKioskId;

    /*
     * 아이스크림 주문 저장
     *
     * 아이스크림 화면이며
     * sizeId가 있고 맛이 선택된 경우에만 생성
     */
    if (
        Number(selectedCategory.value) === 1 &&
        sizeId &&
        iceCreamMenus.length > 0
    ) {
        orderData.iceCream = {
            productType: "ICE_CREAM",

            cupId:
                cupId != null
                    ? Number(cupId)
                    : null,

            cupName:
                selectedCup.value?.name ||
                null,

            sizeId:
                Number(sizeId),

            sizeName:
                sizeInfo.value?.name ||
                null,

            flavorCnt:
                Number(
                    sizeInfo.value?.flavorCnt
                ) || iceCreamMenus.length,

            quantity: 1,

            basePrice:
                Number(
                    sizeInfo.value?.price
                ) || 0,

            additionalPrice:
                Number(
                    selectedCup.value
                        ?.additionalPrice
                ) || 0,

            totalPrice:
                Number(totalPrice.value) || 0,

            flavors:
                iceCreamMenus.map(
                    (menu) => ({
                        menuId:
                            Number(
                                menu.menuId ||
                                menu.id
                            ),

                        name:
                            menu.name,

                        menuImg:
                            menu.menuImg ||
                            null
                    })
                )
        };
    }

    /*
     * 아이스모찌 저장
     */
    orderData.mochi =
        mochiMenus.map(
            (item) => ({
                menuId:
                    Number(
                        item.menuId ||
                        item.id
                    ),

                name:
                    item.name,

                menuImg:
                    item.menuImg ||
                    null,

                price:
                    Number(item.price) || 0,

                totalPrice:
                    Number(
                        item.totalPrice
                    ) ||
                    Number(item.price) ||
                    0,

                quantity:
                    Number(item.quantity) || 1,

                options:
                    Array.isArray(
                        item.options
                    )
                        ? item.options
                        : []
            })
        );

    /*
     * 커피 저장
     */
    orderData.coffee =
        coffeeMenus.map(
            (item) => ({
                menuId:
                    Number(
                        item.menuId ||
                        item.id
                    ),

                name:
                    item.name,

                menuImg:
                    item.menuImg ||
                    null,

                price:
                    Number(item.price) || 0,

                sizeId:
                    item.sizeId != null
                        ? Number(item.sizeId)
                        : null,

                sizeName:
                    item.sizeName ||
                    null,

                sizeAdditionalPrice:
                    Number(
                        item.sizeAdditionalPrice
                    ) || 0,

                optionPrice:
                    Number(
                        item.optionPrice
                    ) || 0,

                totalPrice:
                    Number(
                        item.totalPrice
                    ) ||
                    (
                        Number(
                            item.price
                        ) +
                        Number(
                            item.sizeAdditionalPrice
                        ) +
                        Number(
                            item.optionPrice
                        )
                    ),

                quantity:
                    Number(item.quantity) || 1,

                options:
                    Array.isArray(
                        item.options
                    )
                        ? item.options
                        : []
            })
        );

    sessionStorage.setItem(
        "orderData",
        JSON.stringify(orderData)
    );

    console.log(
        "저장된 주문 JSON:",
        orderData
    );
};

    const restoreSavedSelections = () => {
        /*
         * 장바구니에 이미 담긴 상품은 "현재 선택 중"인 상품이 아니다.
         * cartData가 존재하면 이전 선택 상태를 복원하지 않고 빈 상태로 시작한다.
         */
        const savedCart = sessionStorage.getItem("cartData");

        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart.items) && parsedCart.items.length > 0) {
                    selectedMenusByCategory.value = {
                        1: [],
                        2: [],
                        3: []
                    };
                    sessionStorage.removeItem("orderData");
                    return;
                }
            } catch (error) {
                console.error("장바구니 복원 확인 실패:", error);
            }
        }

        const savedOrder = sessionStorage.getItem("orderData");

        if (!savedOrder) {
            return;
        }

        try {
            const savedData = JSON.parse(savedOrder);

            /*
         * 이전 아이스크림 맛 복원
         */
            /*
 * 아이스크림 화면이 아닐 때만
 * 이전 아이스크림 선택을 복원
 *
 * sizeId가 있다는 것은
 * 새 사이즈를 선택하고 맛 선택 화면으로 왔다는 의미
 */
            if (
                !sizeId && savedData.iceCream
                    ?.flavors
                        ?.length > 0
            ) {
                selectedMenusByCategory.value[1] = savedData
                    .iceCream
                    .flavors
                    .map(flavor => ({
                        id: Number(flavor.menuId || flavor.id),

                        menuId: Number(flavor.menuId || flavor.id),

                        categoryId: 1,
                        name: flavor.name,
                        menuImg: flavor.menuImg
                    }));
            }

            /*
         * 이전 아이스모찌 복원
         */
            if (
                savedData.mochi
                    ?.length > 0
            ) {
                selectedMenusByCategory.value[2] = savedData
                    .mochi
                    .map(item => ({
                        id: Number(item.menuId || item.id),

                        menuId: Number(item.menuId || item.id),

                        categoryId: 2,
                        name: item.name,
                        menuImg: item.menuImg,

                        price: Number(item.price) || 0,

                        totalPrice: Number(item.totalPrice) || Number(item.price) || 0,

                        options: item.options || []
                    }));
            }

            /*
         * 이전 커피와 옵션 복원
         */
            if (
                savedData.coffee
                    ?.length > 0
            ) {
                selectedMenusByCategory.value[3] = savedData
                    .coffee
                    .map(item => ({
                        id: Number(item.menuId || item.id),

                        menuId: Number(item.menuId || item.id),

                        categoryId: 3,
                        name: item.name,
                        menuImg: item.menuImg,

                        price: Number(item.price) || 0,

                        sizeId: item.sizeId != null
                            ? Number(item.sizeId)
                            : null,
                        sizeName: item.sizeName || null,
                        sizeAdditionalPrice: Number(item.sizeAdditionalPrice) || 0,

                        optionPrice: Number(item.optionPrice) || 0,

                        totalPrice: Number(item.totalPrice) || (
                            Number(item.price || 0) + Number(item.sizeAdditionalPrice || 0) + Number(item.optionPrice || 0)
                        ),

                        options: item.options || []
                    }));
            }

            console.log("복원된 선택 목록:", selectedMenusByCategory.value);
        } catch (error) {
            console.error("이전 주문 선택 복원 실패:", error);
        }
    };

    /* 8. 카테고리와 메뉴 선택
 *
 */

    const changeCategory = async (categoryId) => {
        if (categoryId === 1) {
            /*
         * 현재 모찌·커피 선택 내용을 먼저 저장
         */
            saveOrderData();

            router.push({path: "/size", query: {
                    orderType
                }});

            return;
        }

        selectedCategory.value = categoryId;

        await loadMenu(categoryId);
    };

    const handleMenuClick = (menu) => {
        const menuCategoryId = Number(menu.categoryId);

        /*
         * 커피는 같은 메뉴라도 사이즈와 옵션을 다르게 하여
         * 여러 잔 추가할 수 있으므로 항상 옵션창을 연다.
         */
        if (menuCategoryId === 3) {
            openCoffeeOptionModal(menu);
            return;
        }

        /*
         * 아이스크림은 같은 맛을 여러 번 선택할 수 있다.
         * 메뉴 카드를 다시 눌러도 삭제하지 않고 새 슬롯에 추가한다.
         * 삭제는 하단의 선택 슬롯을 눌렀을 때만 처리한다.
         */
        if (menuCategoryId === 1) {
            addMenuWithoutOption(menu);
            return;
        }

        /*
         * 아이스모찌는 기존 방식대로 같은 상품을 다시 누르면 선택 취소한다.
         */
        const index = selectedMenus.value.findIndex(
            item => Number(item.id) === Number(menu.id)
        );

        if (index !== -1) {
            removeSelectedMenu(index);
            return;
        }

        addMenuWithoutOption(menu);
    };

    const addMenuWithoutOption = (menu) => {
        /*
     * 아이스크림만 맛 개수 제한
     */
        if (selectedCategory.value === 1 && selectedMenus.value.length >= Number(sizeInfo.value.flavorCnt || 0)) {
            alert(`최대 ${sizeInfo.value.flavorCnt}개의 맛만 선택할 수 있습니다.`);

            return;
        }

        selectedMenus
            .value
            .push({
                ...menu,

                options: [],

                optionPrice: 0,

                totalPrice: Number(menu.price) || 0
            });

        saveOrderData();
    };

    /*
     * 기존 selectMenu 호출이 남아 있어도 동일한 선택 규칙을 사용하도록 통일한다.
     */
    const selectMenu = (menu) => {
        handleMenuClick(menu);
    };

    const isSelected = (id) => {
        return selectedMenus
            .value
            .some(item => item.id === id);
    };

    const removeSelectedMenu = (index) => {
        if (!selectedMenus.value[index]) {
            return;
        }

        /*
         * 하단 선택 슬롯에서 누른 항목 하나만 삭제한다.
         * 같은 맛이 여러 개여도 해당 슬롯의 맛만 제거된다.
         */
        selectedMenus.value.splice(index, 1);

        /*
         * 화면 상태와 sessionStorage의 JSON을 즉시 동기화한다.
         */
        saveOrderData();
    };

    /*커피 옵션 처리*/

    const openCoffeeOptionModal = async (menu) => {
        optionTargetMenu.value = menu;
        selectedOptionIds.value = [];
        selectedCoffeeSizeId.value = null;

        const requests = [];

        if (coffeeOptions.value.length === 0) {
            requests.push(loadCoffeeOptions());
        }

        if (coffeeSizes.value.length === 0) {
            requests.push(loadCoffeeSizes());
        }

        await Promise.all(requests);

        /*
         * 이미 사이즈 목록을 불러온 상태라면 Regular를 기본 선택
         */
        if (!selectedCoffeeSizeId.value) {
            const regularSize = coffeeSizes
                .value
                .find(
                    size => ["regular", "(r)", "r"].includes(String(size.name || "").trim().toLowerCase())
                );

            selectedCoffeeSizeId.value = regularSize
                ?.id ?? coffeeSizes.value[0]
                    ?.id ?? null;
        }

        showOptionModal.value = true;
    };

    const toggleOption = (optionId) => {
        const index = selectedOptionIds
            .value
            .indexOf(optionId);

        if (index !== -1) {
            selectedOptionIds
                .value
                .splice(index, 1);
        } else {
            selectedOptionIds
                .value
                .push(optionId);
        }
    };

    const isOptionSelected = (optionId) => {
        return selectedOptionIds
            .value
            .includes(optionId);
    };

    const confirmCoffeeOption = () => {
        if (!optionTargetMenu.value) {
            return;
        }

        if (!selectedCoffeeSize.value) {
            alert("커피 사이즈를 선택해주세요.");
            return;
        }

        const selectedOptions = coffeeOptions
            .value
            .filter(option => selectedOptionIds.value.includes(option.id))
            .map(option => ({
                menuOptionId: Number(option.id),
                name: option.name,
                price: Number(option.price) || 0
            }));

        const basePrice = Number(optionTargetMenu.value.price) || 0;

        const sizeAdditionalPrice = Number(selectedCoffeeSize.value.price) || 0;

        const optionPrice = selectedOptions.reduce(
            (sum, option) => sum + (Number(option.price) || 0),
            0
        );

        const coffeeItem = {
            ...optionTargetMenu.value,

            /*
             * 같은 커피를 여러 번 담을 수 있도록 선택 인스턴스 ID 부여
             */
            selectionId: `COFFEE-${Date.now()}-${Math
                .random()
                .toString(36)
                .slice(2, 8)}`,

            sizeId: Number(selectedCoffeeSize.value.id),
            sizeName: selectedCoffeeSize.value.name,
            sizeAdditionalPrice,

            options: selectedOptions,
            optionPrice,

            /*
             * 커피 기본가 + 사이즈 추가금 + 옵션 금액
             */
            unitPrice: basePrice + sizeAdditionalPrice + optionPrice,

            totalPrice: basePrice + sizeAdditionalPrice + optionPrice
        };

        selectedMenus
            .value
            .push(coffeeItem);

        saveOrderData();
        closeOptionModal();
    };

    const closeOptionModal = () => {
        showOptionModal.value = false;

        optionTargetMenu.value = null;

        selectedOptionIds.value = [];
        selectedCoffeeSizeId.value = null;
    };

    /* 10. 장바구니 처리
 *
 */

    const resetCurrentSelection = () => {
        selectedMenusByCategory.value[selectedCategory.value] = [];
        sessionStorage.removeItem("orderData");
    };

    const addCurrentSelectionToCart = () => {
        if (selectedCategory.value === 1) {
            const flavorCnt = Number(sizeInfo.value.flavorCnt) || 0;
            const flavors = selectedMenusByCategory.value[1];

            if (!sizeId || flavorCnt === 0 || flavors.length !== flavorCnt) {
                alert(`${flavorCnt}개의 아이스크림 맛을 모두 선택해주세요.`);
                return;
            }

            cartItems
                .value
                .push({
                    cartItemId: `ICE-${Date.now()}-${Math
                        .random()
                        .toString(36)
                        .slice(2, 7)}`,
                    productType: "ICE_CREAM",
                    name: sizeInfo.value.name || "아이스크림",
                    menuImg: flavors[0]
                        ?.menuImg || null,
                    cupId: cupId != null
                        ? Number(cupId)
                        : null,
                    cupName: selectedCup.value
                        ?.name || null,
                    sizeId: Number(sizeId),
                    sizeName: sizeInfo.value.name || null,
                    quantity: 1,
                    unitPrice: totalPrice.value,
                    totalPrice: totalPrice.value,
                    menus: flavors.map(menu => ({
                        menuId: Number(menu.menuId || menu.id),
                        name: menu.name,
                        menuImg: menu.menuImg
                    })),
                    options: []
                });
        } else {
            const selected = selectedMenusByCategory.value[selectedCategory.value];

            if (selected.length === 0) {
                alert("상품을 1개 이상 선택해주세요.");
                return;
            }

            selected.forEach(menu => {
                const isCoffee = selectedCategory.value === 3;
                const unitPrice = isCoffee
                    ? Number(menu.unitPrice ?? menu.totalPrice) || 0
                    : Number(menu.price ?? menu.totalPrice) || 0;

                cartItems
                    .value
                    .push({
                        cartItemId: `${isCoffee
                            ? "COFFEE"
                            : "MOCHI"}-${Date.now()}-${Math
                                .random()
                                .toString(36)
                                .slice(2, 8)}`,
                        productType: isCoffee
                            ? "COFFEE"
                            : "MOCHI",
                        name: menu.name,
                        menuImg: menu.menuImg || null,
                        cupId: null,
                        sizeId: menu.sizeId != null
                            ? Number(menu.sizeId)
                            : null,
                        sizeName: menu.sizeName || null,
                        quantity: 1,
                        unitPrice,
                        totalPrice: unitPrice,
                        menus: [
                            {
                                menuId: Number(menu.menuId || menu.id),
                                name: menu.name,
                                menuImg: menu.menuImg
                            }
                        ],
                        options: (menu.options || []).map(option => ({
                            menuOptionId: Number(option.menuOptionId || option.id),
                            name: option.name,
                            price: Number(option.price) || 0
                        }))
                    });
            });
        }

        saveCart();
        resetCurrentSelection();
        showCart.value = true;
    };

    const increaseQuantity = (index) => {
        cartItems
            .value[index]
            .quantity = (Number(cartItems.value[index].quantity) || 1) + 1;
        saveCart();
    };

    const decreaseQuantity = (index) => {
        const quantity = Number(cartItems.value[index].quantity) || 1;
        if (quantity <= 1) {
            removeCartItem(index);
            return;
        }
        cartItems
            .value[index]
            .quantity = quantity - 1;
        saveCart();
    };

    const removeCartItem = (index) => {
        cartItems
            .value
            .splice(index, 1);
        saveCart();
    };

    const continueShopping = () => {
        showCart.value = false;
        router.push({
            path: "/size",
            query: {
                orderType: orderType || "TAKEOUT"
            }
        });
    };

    const goPayment = () => {
        if (cartItems.value.length === 0) {
            alert("장바구니가 비어 있습니다.");
            return;
        }

        saveCart();

        /*
         * 결제 페이지와 백엔드가 같은 구조를 사용하도록
         * 장바구니 전체를 orderData.items에 저장한다.
         */
        const unifiedOrderData = {
            orderType: orderType || "TAKEOUT",
            customerId: null,
            branchId: currentBranchId,
            kioskId: currentKioskId,

            items: cartItems
                .value
                .map(item => ({
                    ...item,
                    quantity: Number(item.quantity) || 1,
                    unitPrice: Number(item.unitPrice ?? item.totalPrice) || 0,
                    totalPrice: (Number(item.unitPrice ?? item.totalPrice) || 0) * (
                        Number(item.quantity) || 1
                    ),
                    menus: Array.isArray(item.menus)
                        ? item.menus
                        : [],
                    options: Array.isArray(item.options)
                        ? item.options
                        : []
                })),

            member: null
        };

        sessionStorage.setItem("orderData", JSON.stringify(unifiedOrderData));

        console.log("결제 페이지로 전달할 주문 데이터:", unifiedOrderData);

        router.push("/payment");
    };

    /* 11. 화면 이동
 *
 */

    const goBack = () => {
        router.back();
    };

    const goHome = () => {
        const hasOrder = cartItems.value.length > 0 || selectedMenusByCategory
            .value[1]
            .length > 0 || selectedMenusByCategory
            .value[2]
            .length > 0 || selectedMenusByCategory
            .value[3]
            .length > 0;

        if (hasOrder && !window.confirm("현재 주문을 취소하고 처음 화면으로 이동할까요?")) {
            return;
        }

        sessionStorage.removeItem("orderData");
        sessionStorage.removeItem("cartData");
        sessionStorage.removeItem("paymentData");
        router.push("/");
    };

    /* 페이지 최초 실행 */

    onMounted(async () => {
        loadCart();

        /*
         * 장바구니에 담긴 상품과 현재 선택 상태를 분리한다.
         * 이미 장바구니가 있으면 새 선택 화면은 항상 빈 상태로 시작한다.
         */
        const savedCart = sessionStorage.getItem("cartData");
        let hasCartItems = false;

        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                hasCartItems = Array.isArray(parsedCart.items) && parsedCart.items.length > 0;
            } catch (error) {
                console.error("장바구니 확인 실패:", error);
            }
        }

        if (hasCartItems) {
            selectedMenusByCategory.value = {
                1: [],
                2: [],
                3: []
            };
            sessionStorage.removeItem("orderData");
        } else {
            restoreSavedSelections();
        }

        await loadMenu(categoryId);

        if (categoryId === 1 && sizeId) {
            await Promise.all([loadSize(), loadSelectedCup()]);
        }
    });
</script>

<template>
    <main class="kiosk-frame">
        <!-- 상단 -->
        <header class="top-header">
            <button type="button" class="home-button" @click="goHome">
                <img src="/images/home/logo.png" alt="SweetScoop"/>
            </button>

            <div class="header-title">
                플레이버 선택
            </div>

            <button type="button" class="top-home-button" @click="goHome">
                처음으로
            </button>
        </header>

        <!-- 주문 상품 정보 -->
        <!-- 아이스크림 상품 정보 -->
        <section v-if="sizeId" class="product-summary">
            <div class="summary-content">
                <span class="summary-badge">아이스크림</span>

                <h1>{{ sizeInfo.name || "사이즈 정보" }}</h1>

                <p class="cup-info">
                    {{ selectedCup?.name || "제공 형태 확인 중" }}

                    <strong v-if="Number(selectedCup?.additionalPrice) > 0">
                        +{{
                    Number(
                        selectedCup.additionalPrice
                    ).toLocaleString()
                }}원
                    </strong>
                </p>
            </div>

            <div class="summary-price-area">
                <span>상품 금액</span>

                <strong>
                    {{ totalPrice.toLocaleString() }}원
                </strong>
            </div>
        </section>

        <!-- 아이스모찌·커피 화면 -->
        <section v-else class="product-summary category-summary">
            <div class="summary-content">
                <span class="summary-badge">
                    메뉴 선택
                </span>

                <h1>
                    {{
                selectedCategory === 2
                    ? "아이스모찌"
                    : "커피"
            }}
                </h1>

                <p class="category-description">
                    원하는 상품을 선택해주세요.
                </p>
            </div>

            <div class="summary-price-area">
                <span>선택 수량</span>

                <strong>
                    {{ selectedCount }}개
                </strong>
            </div>
        </section>

        <nav class="category-tab">
            <button
                type="button"
                :class="{ active: selectedCategory === 1 }"
                @click="changeCategory(1)">
                아이스크림
            </button>

            <button
                type="button"
                :class="{ active: selectedCategory === 2 }"
                @click="changeCategory(2)">
                아이스모찌
            </button>

            <button
                type="button"
                :class="{ active: selectedCategory === 3 }"
                @click="changeCategory(3)">
                커피
            </button>
        </nav>

        <div class="menu-guide">
            <div>
                <strong>
                    {{
                selectedCategory === 1
                    ? "원하는 맛을 선택해주세요"
                    : "원하는 상품을 선택해주세요"
            }}
                </strong>

                <p v-if="selectedCategory === 1">
                    같은 맛을 여러 번 선택할 수 있습니다. 삭제는 아래 선택 내역을 눌러주세요.
                </p>

                <p v-else>
                    선택한 상품을 다시 누르면 취소됩니다.
                </p>
            </div>

            <span>
                {{ selectedCount }}개 선택
            </span>
        </div>

        <!-- 메뉴 목록 -->
        <section class="menu-section">
            <p v-if="loading" class="status-message">
                메뉴를 불러오는 중입니다.
            </p>

            <p v-else-if="menus.length === 0" class="status-message">
                등록된 메뉴가 없습니다.
            </p>

            <div v-else class="menu-grid">
                <MenuCard
                    v-for="menu in menus"
                    :key="menu.id"
                    :menu="menu"
                    :selected="isSelected(menu.id)"
                    @selectMenu="handleMenuClick"/>
            </div>
        </section>

        <!-- 선택 상태 -->
        <section class="selection-status">
            <div>
                <span class="selection-label">
                    선택 내역
                </span>

                <strong v-if="selectedCategory === 1">
                    {{ selectedCount }}

                    {{ sizeInfo.flavorCnt || 0 }}
                </strong>

                <strong v-else>
                    {{ selectedCount }}개
                </strong>
            </div>

            <p>
                하단의 선택한 메뉴를 누르면 해당 항목이 제거됩니다.
            </p>
        </section>

        <!-- 빈 슬롯 및 선택된 맛 -->
        <section class="selected-area">
            <button
                v-for="(slot, index) in flavorSlots"
                :key="index"
                type="button"
                class="selected-slot"
                @click="removeSelectedMenu(index)">
                <div
                    class="slot-box"
                    :class="{
                        filled: selectedMenus[index]
                    }">
                    <img
                        v-if="selectedMenus[index]"
                        :src="
                            selectedMenus[index].menuImg
                        "
                        :alt="
                            selectedMenus[index].name
                        "/>

                    <span v-else class="empty-symbol">
                        +
                    </span>
                </div>

                <span class="slot-number">
                    {{ index + 1 }}
                </span>

                <p class="slot-name">
                    {{
                        selectedMenus[index]
                            ? selectedMenus[index].name
                            : "맛 선택"
                    }}
                </p>
            </button>
        </section>

        <div
            v-if="showOptionModal"
            class="option-modal-overlay"
            @click.self="closeOptionModal">
            <section class="option-modal">
                <button type="button" class="option-close-button" @click="closeOptionModal">
                    ×
                </button>

                <div v-if="optionTargetMenu" class="option-menu-info">
                    <img :src="optionTargetMenu.menuImg" :alt="optionTargetMenu.name"/>

                    <div>
                        <span>커피 옵션 선택</span>

                        <h2>
                            {{ optionTargetMenu.name }}
                        </h2>

                        <strong>
                            {{
                        Number(
                            optionTargetMenu.price || 0
                        ).toLocaleString()
                    }}원
                        </strong>
                    </div>
                </div>

                <p class="option-description">
                    커피 사이즈를 선택한 뒤 추가 옵션을 선택해주세요. 옵션은 선택하지 않아도 됩니다.
                </p>

                <section class="coffee-size-section">
                    <h3>사이즈 선택</h3>

                    <p v-if="loadingCoffeeSizes" class="option-status">
                        사이즈를 불러오는 중입니다.
                    </p>

                    <div v-else class="coffee-size-list">
                        <button
                            v-for="size in coffeeSizes"
                            :key="size.id"
                            type="button"
                            class="coffee-size-button"
                            :class="{
                                selected:
                                    Number(selectedCoffeeSizeId) === Number(size.id)
                            }"
                            @click="selectedCoffeeSizeId = size.id">
                            <strong>{{ size.name }}</strong>

                            <span>
                                {{
                                    Number(size.price) > 0
                                        ? `+${Number(size.price).toLocaleString()}원`
                                        : "추가금 없음"
                                }}
                            </span>
                        </button>
                    </div>
                </section>

                <h3 class="option-section-title">추가 옵션</h3>

                <p v-if="loadingOptions" class="option-status">
                    옵션을 불러오는 중입니다.
                </p>

                <div v-else class="option-list">
                    <button
                        v-for="option in coffeeOptions"
                        :key="option.id"
                        type="button"
                        class="option-card"
                        :class="{
                    selected:
                        isOptionSelected(option.id)
                }"
                        @click="toggleOption(option.id)">
                        <span class="option-check">
                            {{
                        isOptionSelected(option.id)
                            ? "✓"
                            : ""
                    }}
                        </span>

                        <div>
                            <strong>
                                {{ option.name }}
                            </strong>

                            <small>
                                +{{
                            Number(
                                option.price
                            ).toLocaleString()
                        }}원
                            </small>
                        </div>
                    </button>
                </div>

                <div class="option-price-box">
                    <div>
                        <span>기본 가격</span>

                        <strong>
                            {{
                        Number(
                            optionTargetMenu?.price || 0
                        ).toLocaleString()
                    }}원
                        </strong>
                    </div>

                    <div>
                        <span>
                            {{ selectedCoffeeSize?.name || "사이즈" }}
                        </span>

                        <strong>
                            +{{
                                coffeeSizeAdditionalPrice
                                    .toLocaleString()
                            }}원
                        </strong>
                    </div>

                    <div>
                        <span>옵션 추가</span>

                        <strong>
                            +{{
                        selectedOptionPrice
                            .toLocaleString()
                    }}원
                        </strong>
                    </div>

                    <div class="option-total-row">
                        <span>총 금액</span>

                        <strong>
                            {{
                        optionTargetTotalPrice
                            .toLocaleString()
                    }}원
                        </strong>
                    </div>
                </div>

                <div class="option-button-group">
                    <button type="button" class="option-cancel-button" @click="closeOptionModal">
                        취소
                    </button>

                    <button
                        type="button"
                        class="option-confirm-button"
                        @click="confirmCoffeeOption">
                        {{
                    selectedOptionIds.length > 0
                        ? "선택 완료"
                        : "옵션 없이 추가"
                }}
                    </button>
                </div>
            </section>
        </div>

        <!-- 장바구니 모달 -->
        <div v-if="showCart" class="cart-overlay" @click.self="showCart = false">
            <section class="cart-panel">
                <header class="cart-header">
                    <div>
                        <span>장바구니</span>
                        <h2>{{ cartCount }}개 상품</h2>
                    </div>
                    <button type="button" @click="showCart = false">×</button>
                </header>

                <p v-if="cartItems.length === 0" class="cart-empty">장바구니가 비어 있습니다.</p>

                <div v-else class="cart-list">
                    <article
                        v-for="(item, index) in cartItems"
                        :key="item.cartItemId"
                        class="cart-item">
                        <img v-if="item.menuImg" :src="item.menuImg" :alt="item.name"/>
                        <div class="cart-item-info">
                            <h3>{{ item.name }}</h3>

                            <template v-if="item.productType === 'ICE_CREAM'">
                                <p v-if="item.sizeName">
                                    사이즈:
                                    {{ item.sizeName }}
                                </p>

                                <p v-if="item.cupName">
                                    제공 형태:
                                    {{ item.cupName }}
                                </p>

                                <p v-if="item.menus?.length" class="cart-flavor-list">
                                    선택한 맛:
                                    {{ item.menus.map(menu => menu.name).join(', ') }}
                                </p>
                            </template>

                            <template v-else>
                                <p v-if="item.sizeName">
                                    사이즈:
                                    {{ item.sizeName }}
                                </p>
                            </template>

                            <p v-if="item.options?.length">
                                옵션:
                                {{ item.options.map(option => option.name).join(', ') }}
                            </p>
                            <strong>{{ (Number(item.unitPrice) * Number(item.quantity || 1)).toLocaleString() }}원</strong>
                        </div>
                        <div class="quantity-control">
                            <button type="button" @click="decreaseQuantity(index)">−</button>
                            <span>{{ item.quantity || 1 }}</span>
                            <button type="button" @click="increaseQuantity(index)">+</button>
                            <button type="button" class="remove" @click="removeCartItem(index)">삭제</button>
                        </div>
                    </article>
                </div>

                <div class="cart-total">
                    <span>총 금액</span>
                    <strong>{{ cartTotalPrice.toLocaleString() }}원</strong>
                </div>

                <div class="cart-actions">
                    <button type="button" class="continue" @click="continueShopping">메뉴 더 담기</button>
                    <button
                        type="button"
                        class="pay"
                        :disabled="cartItems.length === 0"
                        @click="goPayment">결제하기</button>
                </div>
            </section>
        </div>

        <!-- 하단 -->
        <footer class="bottom-bar cart-bottom-bar">
            <button type="button" class="bottom-button previous" @click="showCart = true">
                장바구니
                {{ cartCount }}
            </button>

            <button
                type="button"
                class="bottom-button next"
                :disabled="!canMoveToPayment"
                @click="addCurrentSelectionToCart">
                장바구니 담기
            </button>
        </footer>
    </main>
</template>

<style scoped="scoped">
    :global(body) {
        margin: 0;
        background: #ececec;
        font-family: "Malgun Gothic", "Segoe UI", sans-serif;
    }

    * {
        box-sizing: border-box;
    }

    button {
        font-family: inherit;
    }

    .kiosk-frame {
        width: 100%;
        min-height: 100vh;
        margin: 0 auto;
        padding-bottom: 125px;
        background: #ffffff;
        position: relative;
    }

    /* 상단 */

    .top-header {
        position: sticky;
        top: 0;
        z-index: 20;
        height: 64px;
        display: grid;
        grid-template-columns: 58px 1fr 58px;
        align-items: center;
        padding: 6px 14px;
        border-bottom: 1px solid #f1f1f1;
        background: rgba(255, 255, 255, 0.97);
    }

    .home-button {
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
    }

    .home-button img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .header-title {
        text-align: center;
        color: #222;
        font-size: 17px;
        font-weight: 800;
    }

    .top-home-button {
        height: 36px;
        padding: 0;
        border: 0;
        border-radius: 20px;
        background: #fff0f7;
        color: #e60073;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
    }

    /* 상품 요약 */

    .product-summary {
        margin: 16px 16px 14px;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        border: 1px solid #ffd6e9;
        border-radius: 22px;
        background: linear-gradient(135deg, #fff7fb, #ffffff);
        box-shadow: 0 8px 24px rgba(255, 20, 147, 0.08);
    }

    .summary-content {
        min-width: 0;
    }

    .summary-badge {
        display: inline-flex;
        padding: 5px 10px;
        border-radius: 20px;
        background: #ff1493;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
    }

    .summary-content h1 {
        margin: 9px 0 0;
        color: #222;
        font-size: 21px;
        line-height: 1.3;
    }

    .category-description,
    .cup-info {
        margin: 7px 0 0;
        color: #777;
        font-size: 12px;
    }

    .cup-info strong {
        margin-left: 5px;
        color: #ff1493;
    }

    .summary-price-area {
        flex-shrink: 0;
        text-align: right;
    }

    .summary-price-area span {
        display: block;
        margin-bottom: 5px;
        color: #999;
        font-size: 10px;
    }

    .summary-price-area strong {
        color: #ff1493;
        font-size: 20px;
        white-space: nowrap;
    }

    /* 카테고리 탭 */

    .category-tab {
        position: sticky;
        top: 64px;
        z-index: 15;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        margin: 0;
        padding: 0 14px;
        border-bottom: 1px solid #eeeeee;
        background: #ffffff;
    }

    .category-tab button {
        position: relative;
        padding: 15px 4px 13px;
        border: 0;
        background: #ffffff;
        color: #9a9a9a;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
    }

    .category-tab button::after {
        content: "";
        width: 0;
        height: 3px;
        position: absolute;
        left: 50%;
        bottom: 0;
        border-radius: 3px;
        background: #ff1493;
        transform: translateX(-50%);
        transition: width 0.2s;
    }

    .category-tab button.active {
        color: #ff1493;
    }

    .category-tab button.active::after {
        width: 55%;
    }

    /* 메뉴 안내 */

    .menu-guide {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        padding: 18px 18px 12px;
    }

    .menu-guide strong {
        color: #222;
        font-size: 15px;
    }

    .menu-guide p {
        margin: 4px 0 0;
        color: #999;
        font-size: 10px;
    }

    .menu-guide > span {
        flex-shrink: 0;
        padding: 7px 11px;
        border-radius: 20px;
        background: #fff0f7;
        color: #ff1493;
        font-size: 11px;
        font-weight: 800;
    }

    /* 메뉴 목록 */

    .menu-section {
        min-height: 340px;
        padding: 0 14px 24px;
    }

    .menu-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px 6px;
    }

    .status-message {
        padding: 100px 0;
        text-align: center;
        color: #999;
        font-size: 13px;
    }

    /* 선택 상태 */

    .selection-status {
        margin: 12px 16px 10px;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 15px;
        background: #fff5fa;
    }

    .selection-status > div {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .selection-label {
        color: #666;
        font-size: 12px;
    }

    .selection-status strong {
        color: #ff1493;
        font-size: 16px;
    }

    .selection-status p {
        margin: 0;
        color: #999;
        font-size: 9px;
    }

    /* 선택 상품 */

    .selected-area {
        min-height: 115px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 11px;
        padding: 5px 14px 20px;
        overflow-x: auto;
    }

    .selected-slot {
        flex: 0 0 74px;
        padding: 0;
        border: 0;
        background: transparent;
        text-align: center;
        cursor: pointer;
    }

    .slot-box {
        width: 68px;
        height: 68px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px dashed #ff9dcb;
        border-radius: 18px;
        background: #fffafd;
        overflow: hidden;
    }

    .slot-box.filled {
        border-style: solid;
        border-color: #ff1493;
        background: #ffffff;
    }

    .slot-box img {
        width: 62px;
        height: 62px;
        object-fit: contain;
    }

    .empty-symbol {
        color: #ff9dcb;
        font-size: 24px;
    }

    .slot-number {
        width: 19px;
        height: 19px;
        margin: -7px auto 0;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        background: #ff1493;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
    }

    .slot-name {
        min-height: 25px;
        margin: 5px 0 0;
        color: #666;
        font-size: 9px;
        line-height: 1.35;
    }

    /* 하단 버튼 */

    .bottom-bar {
        width: min(100%, 540px);
        position: fixed;
        left: 50%;
        bottom: 0;
        z-index: 30;
        transform: translateX(-50%);
        display: grid;
        grid-template-columns: 0.8fr 1.2fr;
        gap: 12px;
        padding: 15px 14px 18px;
        border-top: 1px solid #eeeeee;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.06);
    }

    .bottom-button {
        height: 58px;
        border-radius: 30px;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
    }

    .bottom-button.previous {
        border: 1px solid #dddddd;
        background: #ffffff;
        color: #ff1493;
    }

    .bottom-button.next {
        border: 0;
        background: linear-gradient(135deg, #ff1493, #ff4da6);
        color: #ffffff;
        box-shadow: 0 8px 18px rgba(255, 20, 147, 0.22);
    }

    .bottom-button.next:disabled {
        background: #d8d8d8;
        box-shadow: none;
        cursor: not-allowed;
    }

    .arrow {
        margin-right: 10px;
        font-size: 28px;
        line-height: 0;
        vertical-align: -2px;
    }

    @media (max-width: 480px) {
        .product-summary {
            margin: 12px;
            padding: 17px;
        }

        .summary-content h1 {
            font-size: 18px;
        }

        .summary-price-area strong {
            font-size: 17px;
        }

        .menu-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .selected-area {
            justify-content: flex-start;
        }

        .selection-status {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
        }
    }

    .option-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 300;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 18px;
        background: rgba(0, 0, 0, 0.5);
    }

    .option-modal {
        width: min(100%, 430px);
        max-height: 90vh;
        position: relative;
        padding: 26px 22px 22px;
        overflow-y: auto;
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 20px 70px rgba(0, 0, 0, 0.25);
    }

    .option-close-button {
        width: 34px;
        height: 34px;
        position: absolute;
        top: 12px;
        right: 12px;
        border: 0;
        border-radius: 50%;
        background: #f3f3f3;
        color: #777777;
        font-size: 21px;
        cursor: pointer;
    }

    .option-menu-info {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-right: 38px;
    }

    .option-menu-info img {
        width: 90px;
        height: 90px;
        object-fit: contain;
    }

    .option-menu-info span {
        color: #999999;
        font-size: 11px;
    }

    .option-menu-info h2 {
        margin: 4px 0 7px;
        color: #222222;
        font-size: 19px;
    }

    .option-menu-info strong {
        color: #ff1493;
        font-size: 15px;
    }

    .option-description {
        margin: 20px 0 15px;
        color: #777777;
        font-size: 12px;
        line-height: 1.6;
    }

    .option-status {
        padding: 30px 0;
        color: #999999;
        font-size: 13px;
        text-align: center;
    }

    .coffee-size-section {
        margin: 18px 0;
    }

    .coffee-size-section h3,
    .option-section-title {
        margin: 0 0 10px;
        color: #333333;
        font-size: 14px;
    }

    .coffee-size-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .coffee-size-button {
        min-height: 72px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        border: 2px solid #eeeeee;
        border-radius: 15px;
        background: #ffffff;
        cursor: pointer;
    }

    .coffee-size-button strong {
        color: #333333;
        font-size: 14px;
    }

    .coffee-size-button span {
        color: #999999;
        font-size: 11px;
    }

    .coffee-size-button.selected {
        border-color: #ff1493;
        background: #fff2f8;
    }

    .coffee-size-button.selected span,
    .coffee-size-button.selected strong {
        color: #ff1493;
    }

    .option-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .option-card {
        width: 100%;
        min-height: 68px;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 12px 15px;
        border: 2px solid #eeeeee;
        border-radius: 15px;
        background: #ffffff;
        text-align: left;
        cursor: pointer;
    }

    .option-card.selected {
        border-color: #ff1493;
        background: #fff2f8;
    }

    .option-check {
        width: 25px;
        height: 25px;
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px solid #dddddd;
        border-radius: 50%;
        color: #ffffff;
        font-size: 14px;
    }

    .option-card.selected .option-check {
        border-color: #ff1493;
        background: #ff1493;
    }

    .option-card > div {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .option-card strong {
        color: #333333;
        font-size: 14px;
    }

    .option-card small {
        color: #ff1493;
        font-size: 12px;
        font-weight: 700;
    }

    .option-price-box {
        margin-top: 18px;
        padding: 14px;
        border-radius: 15px;
        background: #f8f8f8;
    }

    .option-price-box > div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        color: #777777;
        font-size: 12px;
    }

    .option-price-box > div:last-child {
        margin-bottom: 0;
    }

    .option-total-row {
        padding-top: 10px;
        border-top: 1px solid #dddddd;
    }

    .option-total-row span {
        color: #333333;
        font-weight: 800;
    }

    .option-total-row strong {
        color: #ff1493;
        font-size: 17px;
    }

    .option-button-group {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 10px;
        margin-top: 18px;
    }

    .option-button-group button {
        height: 50px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
    }

    .option-cancel-button {
        border: 1px solid #dddddd;
        background: #ffffff;
        color: #666666;
    }

    .option-confirm-button {
        border: 0;
        background: #ff1493;
        color: #ffffff;
    }

    .cart-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background: rgba(0,0,0,.45);
    }
    .cart-panel {
        width: min(100%, 540px);
        max-height: 86vh;
        overflow-y: auto;
        padding: 22px 18px 24px;
        border-radius: 26px 26px 0 0;
        background: #fff;
    }
    .cart-actions,
    .cart-header,
    .cart-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }
    .cart-header h2 {
        margin: 4px 0 0;
    }
    .cart-header > button {
        border: 0;
        background: transparent;
        font-size: 30px;
        cursor: pointer;
    }
    .cart-list {
        display: grid;
        gap: 12px;
        margin: 18px 0;
    }
    .cart-item {
        display: grid;
        grid-template-columns: 70px 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 12px;
        border: 1px solid #f1d5e4;
        border-radius: 16px;
    }
    .cart-item img {
        width: 68px;
        height: 68px;
        object-fit: contain;
    }
    .cart-item-info h3 {
        margin: 0 0 5px;
        font-size: 14px;
    }
    .cart-item-info p {
        margin: 2px 0;
        color: #777;
        font-size: 11px;
    }
    .cart-item-info .cart-flavor-list {
        color: #555;
        line-height: 1.45;
    }
    .cart-item-info strong {
        display: block;
        margin-top: 6px;
        color: #ff1493;
    }
    .quantity-control {
        display: grid;
        grid-template-columns: 30px 28px 30px;
        gap: 4px;
        align-items: center;
        text-align: center;
    }
    .quantity-control button {
        height: 30px;
        border: 1px solid #ddd;
        border-radius: 9px;
        background: #fff;
        cursor: pointer;
    }
    .quantity-control .remove {
        grid-column: 1 / 4;
        color: #d33;
    }
    .cart-total {
        padding: 16px 2px;
        border-top: 1px solid #eee;
        font-size: 18px;
    }
    .cart-total strong {
        color: #ff1493;
        font-size: 22px;
    }
    .cart-actions button {
        flex: 1;
        height: 52px;
        border-radius: 26px;
        font-weight: 800;
        cursor: pointer;
    }
    .cart-actions .continue {
        border: 1px solid #ff1493;
        background: #fff;
        color: #ff1493;
    }
    .cart-actions .pay {
        border: 0;
        background: #ff1493;
        color: #fff;
    }
    .cart-empty {
        padding: 50px 0;
        text-align: center;
        color: #999;
    }
</style>