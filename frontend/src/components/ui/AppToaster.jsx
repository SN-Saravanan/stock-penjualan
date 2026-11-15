import { Toaster } from "sonner";

function AppToaster() {
  return (
    <Toaster
      position="top-right"
      theme="light"
      richColors
      closeButton
      expand={false}
      visibleToasts={4}
      gap={10}
      duration={3500}
      offset={{
        top: 20,
        right: 20,
      }}
      mobileOffset={{
        top: 12,
        right: 12,
        left: 12,
        bottom: 80,
      }}
      swipeDirections={["left", "right"]}
      containerAriaLabel="Notifikasi Sistem Stok Penjualan"
      toastOptions={{
        classNames: {
          toast: "stock-sales-toast",
          title: "stock-sales-toast-title",
          description: "stock-sales-toast-description",
          closeButton: "stock-sales-toast-close",
        },
      }}
    />
  );
}

export default AppToaster;
