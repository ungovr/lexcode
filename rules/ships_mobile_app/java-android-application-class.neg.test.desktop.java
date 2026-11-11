// lexcode-expect: 0
// A JavaFX desktop program: its main class extends javafx.application.Application, which is
// not an Android app.
package demo.desktop;

import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.stage.Stage;

public class Viewer extends Application {
  @Override
  public void start(Stage stage) {
    stage.setScene(new Scene(new Label("Hello")));
    stage.show();
  }

  public static void main(String[] args) {
    launch(args);
  }
}
