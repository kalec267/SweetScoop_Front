export const PrinterService = {
  printReceipt(receiptData) {
    if (!receiptData) {
      console.warn('====== [HARDWARE DRIVER] 영수증 데이터가 유효하지 않습니다. ======');
      return;
    }

    console.log('====== [HARDWARE DRIVER] 영수증 출력 가동 ======');
    console.log(`내부 매핑 주문ID : ${receiptData.orderId || 'N/A'}`);
    console.log(`통합 영수증 번호 : ${receiptData.receiptNo || 'N/A'}`);
    console.log(`▶▶ [고객 호출 번호] : ${receiptData.waitingNo || 'N/A'}번`);
    console.log(`결제 승인 수단  : ${receiptData.paymentMethod || '미지정'} (${receiptData.cardCompany || '신용카드'})`);
    
    console.log('--- 주문 상세 ---');
    if (receiptData.items && Array.isArray(receiptData.items)) {
      receiptData.items.forEach(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        // 여기서 정상적으로 로그를 출력합니다.
        console.log(`${item.menuName || '이름 없음'} x ${quantity} : ${price.toLocaleString()}원`);
      });
    }
    
    const totalPrice = Number(receiptData.totalPrice) || 0;
    console.log(`최종 결제 금액  : ${totalPrice.toLocaleString()}원`);
    console.log(`주문 발생 시각  : ${receiptData.orderTime || new Date().toLocaleString()}`);
    console.log('================================================');

    // 💡 에러의 원인이었던 불필요한 하단 중복 출력 로직을 삭제했습니다.

    // 키오스크 물리 장비 연동
    if (window.KioskPrinterSDK) {
      window.KioskPrinterSDK.printText(`호출대기번호: ${receiptData.waitingNo || 'N/A'}\n`);
      window.KioskPrinterSDK.cutPaper();
    }
  }
};