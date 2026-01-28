Imports System
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Text
Imports System.Windows.Forms

Imports Neurotec.Biometrics

Namespace VBNETSample
	Partial Public Class ChooseScannerForm
		Inherits Form
		Private _allModuleString As String = String.Empty
		Private _scannerString As String = String.Empty

		Public Sub New()
			InitializeComponent()

			_allModuleString = Nffv.GetAvailableScannerModules()
			If _allModuleString.Length > 0 Then
				Dim allModuleList As String() = _allModuleString.Split(New Char() {";"c})
				clbScannerList.Items.Clear()
				clbScannerList.Items.AddRange(allModuleList)
			Else
				clbScannerList.Items.Add("No scanner modules found.")
				clbScannerList.Enabled = False
			End If
		End Sub

		Private Sub btnOK_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnOK.Click
			If clbScannerList.CheckedItems.Count = 0 Then
				DialogResult = DialogResult.None
				MessageBox.Show(Nothing, "No scanners were selected", "Warning", MessageBoxButtons.OK, MessageBoxIcon.[Warning])
				Return
			End If
			If _allModuleString.Length > 0 Then
				Dim scannerString As New StringBuilder()
				For Each selItem As String In clbScannerList.CheckedItems
					If scannerString.Length > 0 Then
						scannerString.Append(";")
					End If
					scannerString.Append(selItem)
				Next
				_scannerString = scannerString.ToString()
				Close()
			End If
		End Sub

		Public ReadOnly Property ScannerString() As String
			Get
				Return _scannerString
			End Get
		End Property

		Public Property FingerprintDatabase() As String
			Get
				Return tbDatabaseName.Text
			End Get
			Set(ByVal value As String)
				tbDatabaseName.Text = Value
			End Set
		End Property

		Public Property FingerprintDatabasePassword() As String
			Get
				Return tbPassword.Text
			End Get
			Set(ByVal value As String)
				tbPassword.Text = Value
			End Set
		End Property

		Public Property UserDatabase() As String
			Get
				Return tbUserDatabase.Text
			End Get
			Set(ByVal value As String)
				tbUserDatabase.Text = Value
			End Set
		End Property
	End Class
End Namespace
