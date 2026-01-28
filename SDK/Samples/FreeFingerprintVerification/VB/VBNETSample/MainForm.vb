Imports System
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Text
Imports System.Windows.Forms

Imports Neurotec.Biometrics

Namespace VBNETSample
	Partial Public Class MainForm
		Inherits Form
		Private _engine As Nffv
		Private _userDatabaseFile As String
		Private _userDB As UserDatabase

		Public Sub New(ByVal engine As Nffv, ByVal userDatabaseFile As String)
			_engine = engine

			_userDatabaseFile = userDatabaseFile
			Try
				_userDB = UserDatabase.ReadFromFile(userDatabaseFile)
			Catch
				_userDB = New UserDatabase()
			End Try

			InitializeComponent()
		End Sub

		Private Sub MainForm_Load(ByVal sender As Object, ByVal e As EventArgs) Handles MyBase.Load
			For Each engineUser As NffvUser In _engine.Users
				Dim id As String = engineUser.Id.ToString()
				Dim userRec As UserRecord = _userDB.Lookup(engineUser.Id)
				If userRec IsNot Nothing Then
					id = userRec.Name
				End If
				lbDatabase.Items.Add(New CData(engineUser, id))
			Next
			If (lbDatabase.Items.Count > 0) Then
				lbDatabase.SelectedIndex = 0
			End If
		End Sub
		Friend Class EnrollmentResult
			Public engineStatus As NffvStatus
			Public engineUser As NffvUser
		End Class
		Private Sub btnEnroll_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnEnroll.Click
			Dim enrollDlg As New EnrollForm()
			If _engine.Users.Count >= Nffv.MaxUserCount Then
				MessageBox.Show("Maximum number of users is reached.")
				Return
			End If
			If enrollDlg.ShowDialog() = DialogResult.OK Then
				Try
					Dim taskResult As RunWorkerCompletedEventArgs = Neurotec.Gui.BusyForm.RunLongTask("Waiting for fingerprint ...", New DoWorkEventHandler(AddressOf doEnroll), False, Nothing, New EventHandler(AddressOf CancelScanningHandler))
					Dim enrollmentResult As EnrollmentResult = DirectCast(taskResult.Result, EnrollmentResult)
					If enrollmentResult.engineStatus = NffvStatus.TemplateCreated Then
						Dim engineUser As NffvUser = enrollmentResult.engineUser
						Dim userName As String = enrollDlg.UserName
						If userName.Length <= 0 Then
							userName = engineUser.Id.ToString()
						End If

						_userDB.Add(New UserRecord(engineUser.Id, userName))
						Try
							_userDB.WriteToFile(_userDatabaseFile)
						Catch
						End Try

						pbExtractedImage.Image = engineUser.GetBitmap()
						lbDatabase.Items.Add(New CData(engineUser, userName))
						lbDatabase.SelectedIndex = lbDatabase.Items.Count - 1
					Else
						Dim engineStatus As NffvStatus = enrollmentResult.engineStatus
						MessageBox.Show(String.Format("Enrollment was not finished. Reason: {0}", engineStatus))
					End If
				Catch ex As Exception
					MessageBox.Show(ex.Message)
				End Try
			End If
		End Sub

		Private Sub doEnroll(ByVal sender As Object, ByVal args As DoWorkEventArgs)
			Dim enrollmentResults As New EnrollmentResult()
			enrollmentResults.engineUser = _engine.Enroll(20000, enrollmentResults.engineStatus)
			args.Result = enrollmentResults
		End Sub

		Friend Class VerificationResult
			Public engineStatus As NffvStatus
			Public score As Integer
		End Class

		Private Sub btnVerify_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnVerify.Click
			If lbDatabase.SelectedIndex < 0 Then
				MessageBox.Show("Please select a record from the database.")
			Else
				Try
					Dim taskResult As RunWorkerCompletedEventArgs = Neurotec.Gui.BusyForm.RunLongTask("Waiting for fingerprint ...", New DoWorkEventHandler(AddressOf doVerify), False, DirectCast(lbDatabase.SelectedItem, CData).EngineUser, New EventHandler(AddressOf CancelScanningHandler))
					Dim verificationResult As VerificationResult = DirectCast(taskResult.Result, VerificationResult)
					If verificationResult.engineStatus = NffvStatus.TemplateCreated Then
						If verificationResult.score > 0 Then
							MessageBox.Show(String.Format("{0} verified." + Environment.NewLine + "Fingerprints match. Score: {1}", DirectCast(lbDatabase.SelectedItem, CData).Name, verificationResult.score))
						Else
							MessageBox.Show(String.Format("{0} not verified." + Environment.NewLine + "Fingerprints do not match. Score: {1}", DirectCast(lbDatabase.SelectedItem, CData).Name, verificationResult.score))
						End If
					Else
						MessageBox.Show(String.Format("Verification was not finished. Reason: {0}", verificationResult.engineStatus))
					End If
				Catch ex As Exception
					MessageBox.Show(ex.Message)
				End Try
			End If
		End Sub

		Private Sub doVerify(ByVal sender As Object, ByVal args As DoWorkEventArgs)
			Dim verificationResult As New VerificationResult()
			verificationResult.score = _engine.Verify(DirectCast(args.Argument, NffvUser), 20000, verificationResult.engineStatus)
			args.Result = verificationResult
		End Sub

		Private Sub CancelScanningHandler(ByVal sender As Object, ByVal e As EventArgs)
			_engine.Cancel()
		End Sub

		Private Sub btnDeleteUser_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnDeleteUser.Click
			If lbDatabase.SelectedIndex < 0 Then
				MessageBox.Show("Please select a record from the database.")
			Else
				_userDB.Remove(_userDB.Lookup(DirectCast(lbDatabase.SelectedItem, CData).ID))
				Try
					_userDB.WriteToFile(_userDatabaseFile)
				Catch
				End Try

				_engine.Users.RemoveAt(lbDatabase.SelectedIndex)
				lbDatabase.Items.RemoveAt(lbDatabase.SelectedIndex)
				If (lbDatabase.Items.Count > 0) Then
					lbDatabase.SelectedIndex = 0
				End If
			End If
		End Sub

		Private Sub btnClearDatabase_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnClearDatabase.Click
			If MessageBox.Show("All records will be deleted from database. Do you want to continue?", "Confirm delete", MessageBoxButtons.YesNo, MessageBoxIcon.Question) <> DialogResult.Yes Then
				Return
			End If

			_engine.Users.Clear()
			lbDatabase.Items.Clear()

			_userDB.Clear()
			Try
				_userDB.WriteToFile(_userDatabaseFile)
			Catch
			End Try
		End Sub

		Private Sub btnSettings_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnSettings.Click
			Dim settingsForm As New SettingsForm()
			settingsForm.LoadFromEngine(_engine)
			If settingsForm.ShowDialog() = DialogResult.OK Then
				settingsForm.SaveToEngine(_engine)
			End If
		End Sub

		Private Sub btnAbout_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnAbout.Click
			Dim aboutForm As New AboutForm()
			aboutForm.ShowDialog()
		End Sub

		Private Sub lbDatabase_DoubleClick(ByVal sender As Object, ByVal e As EventArgs) Handles lbDatabase.DoubleClick
			If lbDatabase.SelectedItem IsNot Nothing Then
				Dim userData As CData = DirectCast(lbDatabase.SelectedItem, CData)
				Dim userInfoForm As New UserInfoForm()
				userInfoForm.UserName = userData.Name
				userInfoForm.UserFingerprintImage = userData.Image
				userInfoForm.ShowDialog()
			End If
		End Sub

		Private Sub lbDatabase_MouseClick() Handles lbDatabase.MouseClick
			If lbDatabase.SelectedItem IsNot Nothing Then
				Dim userData As CData = DirectCast(lbDatabase.SelectedItem, CData)
				pbExtractedImage.Image = userData.Image
			End If
		End Sub

	End Class

	Public Class CData
		Implements IDisposable
		Private _engineUser As NffvUser
		Private _image As Bitmap
		Private _name As String

		Public Sub New(ByVal engineUser As NffvUser, ByVal name As String)
			_engineUser = engineUser
			_image = engineUser.GetBitmap()
			_name = name
		End Sub

		Public ReadOnly Property EngineUser() As NffvUser
			Get
				Return _engineUser
			End Get
		End Property

		Public ReadOnly Property Image() As Bitmap
			Get
				Return _image
			End Get
		End Property

		Public ReadOnly Property ID() As Integer
			Get
				Return _engineUser.Id
			End Get
		End Property

		Public Property Name() As String
			Get
				Return _name
			End Get
			Set(ByVal value As String)
				_name = value
			End Set
		End Property
		Public Overrides Function ToString() As String
			Return Name
		End Function
#Region "IDisposable Members"

		Public Sub Dispose() Implements IDisposable.Dispose
			If _image IsNot Nothing Then
				_image.Dispose()
				_image = Nothing
			End If
		End Sub

#End Region
	End Class
End Namespace
