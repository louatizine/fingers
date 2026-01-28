
Imports System
Imports System.Collections.Generic
Imports System.Windows.Forms
Imports Neurotec.Biometrics

Namespace VBNETSample
	NotInheritable Class Program
		Private Sub New()
		End Sub
		''' <summary>
		''' The main entry point for the application.
		''' </summary>
		<STAThread()> _
		Public Shared Sub Main()
			Application.EnableVisualStyles()
			Application.SetCompatibleTextRenderingDefault(False)

			Dim engine As Global.Neurotec.Biometrics.Nffv = Nothing
			Try
				Dim chooseScannerForm As New ChooseScannerForm()
				If chooseScannerForm.ShowDialog() = DialogResult.OK Then
					Try
						engine = New Nffv(chooseScannerForm.FingerprintDatabase, chooseScannerForm.FingerprintDatabasePassword, chooseScannerForm.ScannerString)
					Catch generatedExceptionName As Exception
						MessageBox.Show(Nothing, "Failed to initialize Nffv or create/load database." & System.Environment.NewLine & "Please check if:" & System.Environment.NewLine & "- Provided password is correct;" & System.Environment.NewLine & "- Database filename is correct;" & System.Environment.NewLine & "- Scanners are used properly", "VBNETSample", MessageBoxButtons.OK, MessageBoxIcon.[Error])
						Return
					End Try
					Application.Run(New MainForm(engine, chooseScannerForm.UserDatabase))
				End If
			Catch ex As Exception
				MessageBox.Show(String.Format("An error has occured: {0}", ex.Message), "VBNETSample", MessageBoxButtons.OK, MessageBoxIcon.[Error])
			Finally
				If engine IsNot Nothing Then
					engine.Dispose()
				End If
			End Try
		End Sub
	End Class
End Namespace
