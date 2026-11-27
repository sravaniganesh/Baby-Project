type AlertButton = {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

class WebAlert {
  static alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
  ) {
    if (typeof window === "undefined") return;

    const content = [title, message].filter(Boolean).join("\n\n");

    if (!buttons?.length) {
      window.alert(content);
      return;
    }

    if (buttons.length === 1) {
      window.alert(content);
      buttons[0].onPress?.();
      return;
    }

    const confirmed = window.confirm(content);
    const cancelIndex = buttons.findIndex(
      (button) => button.style === "cancel",
    );
    const actionIndex = buttons.findIndex(
      (button) => button.style !== "cancel",
    );
    const selectedButton = confirmed
      ? buttons[actionIndex >= 0 ? actionIndex : buttons.length - 1]
      : buttons[cancelIndex >= 0 ? cancelIndex : 0];

    selectedButton.onPress?.();
  }
}

export default WebAlert;
