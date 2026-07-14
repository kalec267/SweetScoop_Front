export const PrinterService = {
    printReceipt(receiptData) {
      console.log('====== [HARDWARE DRIVER] 영수증 출력 가동 ======');
      console.log(`내부 매핑 주문ID : ${receiptData.orderId}`);
      console.log(`통합 영수증 번호 : ${receiptData.receiptNo}`);
      console.log(`▶▶ [고객 호출 번호] : ${receiptData.waitingNo}번`);
      console.log(`결제 승인 수단  : ${receiptData.paymentMethod} (${receiptData.cardCompany})`);
      
      // 💡 메뉴 상세 목록 출력 추가
      console.log('--- 주문 상세 ---');
      if (receiptData.items && Array.isArray(receiptData.items)) {
        receiptData.items.forEach(item => {
          console.log(`${item.menuName} x ${item.quantity} : ${(item.price).toLocaleString()}원`);
        });
      }
      
      console.log(`최종 결제 금액  : ${receiptData.totalPrice}원`);
      console.log(`주문 발생 시각  : ${receiptData.orderTime}`);
      console.log('================================================');
  
      // 키오스크 물리 장비 연동
      if (window.KioskPrinterSDK) {
        window.KioskPrinterSDK.printText(`호출대기번호: ${receiptData.waitingNo}\n`);
        // 메뉴도 프린터로 뽑고 싶다면 여기서 window.KioskPrinterSDK.printText(...) 추가
        window.KioskPrinterSDK.cutPaper();
      }
    }
  };